package az.premiumreklam.service;

import az.premiumreklam.dto.worker.WorkerTaskPayload;
import az.premiumreklam.dto.worker.WorkerTaskResponse;
import az.premiumreklam.entity.Order;
import az.premiumreklam.entity.User;
import az.premiumreklam.entity.WorkerTask;
import az.premiumreklam.repository.OrderRepository;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.repository.WorkerTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkerTaskAdminService {

    private final WorkerTaskRepository workerTaskRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final StaffAdminService staffAdminService;

    @Transactional(readOnly = true)
    public List<WorkerTaskResponse> listAll() {
        return workerTaskRepository.findAll().stream()
                .map(WorkerTaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkerTaskResponse getById(Long id) {
        WorkerTask t = workerTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tapşırıq tapılmadı"));
        return WorkerTaskResponse.fromEntity(t);
    }

    @Transactional
    public WorkerTaskResponse create(WorkerTaskPayload p) {
        WorkerTask t = new WorkerTask();
        applyPayload(t, p, true);
        return WorkerTaskResponse.fromEntity(workerTaskRepository.save(t));
    }

    @Transactional
    public WorkerTaskResponse update(Long id, WorkerTaskPayload p) {
        WorkerTask t = workerTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tapşırıq tapılmadı"));
        applyPayload(t, p, false);
        return WorkerTaskResponse.fromEntity(workerTaskRepository.save(t));
    }

    @Transactional
    public WorkerTaskResponse patchStatus(Long id, String status) {
        WorkerTask t = workerTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tapşırıq tapılmadı"));
        String norm = normalizeStatus(status);
        if ("in_progress".equals(norm) && t.getDueDate() == null) {
            throw new RuntimeException("“İcra olunur” üçün əvvəlcə təxmini bitmə vaxtını təyin edin.");
        }
        t.setStatus(norm);
        if ("in_progress".equals(norm)) {
            if (t.getWorkStartedAt() == null) {
                t.setWorkStartedAt(LocalDateTime.now());
            }
        } else if ("pending".equals(norm) || "cancelled".equals(norm)) {
            t.setWorkStartedAt(null);
        }
        if ("completed".equals(norm)) {
            t.setCompletedAt(LocalDateTime.now());
        } else {
            t.setCompletedAt(null);
        }
        return WorkerTaskResponse.fromEntity(workerTaskRepository.save(t));
    }

    @Transactional
    public void delete(Long id) {
        workerTaskRepository.deleteById(id);
    }

    private void applyPayload(WorkerTask t, WorkerTaskPayload p, boolean isCreate) {
        if (isCreate || p.getTitle() != null) {
            if (p.getTitle() == null || p.getTitle().isBlank()) {
                throw new RuntimeException("Başlıq tələb olunur");
            }
            t.setTitle(p.getTitle().trim());
        }

        if (p.getDescription() != null) {
            String d = p.getDescription().trim();
            t.setDescription(d.isEmpty() ? null : d);
        } else if (isCreate) {
            t.setDescription(null);
        }

        if (p.getAssignedTo() != null) {
            User assignee = userRepository.findById(p.getAssignedTo())
                    .orElseThrow(() -> new RuntimeException("İşçi tapılmadı"));
            if (!staffAdminService.isStaffRole(assignee.getRole())) {
                throw new RuntimeException("Tapşırıq yalnız daxili işçi (dizayner/usta/çapçı) üzrə təyin oluna bilər");
            }
            t.setAssignedTo(assignee);
        } else if (!isCreate) {
            t.setAssignedTo(null);
        }

        if (p.getPriority() != null && !p.getPriority().isBlank()) {
            t.setPriority(normalizePriority(p.getPriority()));
        } else if (isCreate) {
            t.setPriority("medium");
        }

        if (p.getStatus() != null && !p.getStatus().isBlank()) {
            t.setStatus(normalizeStatus(p.getStatus()));
        } else if (isCreate) {
            t.setStatus("pending");
        }

        if (p.getDueDate() != null) {
            t.setDueDate(parseDateTime(p.getDueDate()));
        } else if (isCreate) {
            t.setDueDate(null);
        }

        if (p.getWorkStartedAt() != null) {
            t.setWorkStartedAt(parseDateTime(p.getWorkStartedAt()));
        } else if (isCreate) {
            t.setWorkStartedAt(null);
        }

        if (p.getOrderId() != null) {
            Order order = orderRepository.findById(p.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
            t.setLinkedOrder(order);
            if (p.getOrderNumber() != null && !p.getOrderNumber().isBlank()) {
                t.setOrderNumber(p.getOrderNumber().trim());
            } else {
                t.setOrderNumber(order.getOrderNumber());
            }
        } else if (!isCreate) {
            t.setLinkedOrder(null);
            if (p.getOrderNumber() != null) {
                String on = p.getOrderNumber().trim();
                t.setOrderNumber(on.isEmpty() ? null : on);
            }
        }

        if (p.getNote() != null) {
            String n = p.getNote().trim();
            t.setNote(n.isEmpty() ? null : n);
        } else if (isCreate) {
            t.setNote(null);
        }

        if ("in_progress".equals(t.getStatus()) && t.getDueDate() == null) {
            throw new RuntimeException("“İcra olunur” statusu üçün bitmə vaxtı tələb olunur");
        }
        if ("in_progress".equals(t.getStatus()) && t.getWorkStartedAt() == null) {
            t.setWorkStartedAt(LocalDateTime.now());
        }
        if ("completed".equals(t.getStatus())) {
            if (t.getCompletedAt() == null) {
                t.setCompletedAt(LocalDateTime.now());
            }
        } else {
            t.setCompletedAt(null);
        }
    }

    private static String normalizeStatus(String s) {
        String t = s == null ? "" : s.trim().toLowerCase().replace('-', '_');
        return switch (t) {
            case "pending", "in_progress", "completed", "cancelled" -> t;
            default -> throw new RuntimeException("Yanlış status: " + s);
        };
    }

    private static String normalizePriority(String s) {
        String t = s == null ? "" : s.trim().toLowerCase();
        return switch (t) {
            case "low", "medium", "high", "urgent" -> t;
            default -> throw new RuntimeException("Yanlış prioritet: " + s);
        };
    }

    private static LocalDateTime parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return ZonedDateTime.parse(s).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.ofInstant(Instant.parse(s), ZoneId.systemDefault());
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Tarix/vaxt oxuna bilmədi: " + raw);
        }
    }
}
