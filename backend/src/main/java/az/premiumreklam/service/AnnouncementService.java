package az.premiumreklam.service;

import az.premiumreklam.dto.announcement.AnnouncementRequest;
import az.premiumreklam.entity.Announcement;
import az.premiumreklam.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public List<Announcement> getAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Announcement> getActive() {
        return announcementRepository.findByIsActiveTrue();
    }

    public Announcement getById(Long id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Elan tapılmadı"));
    }

    // 🔥 Helper: безопасное преобразование строки в enum (case-insensitive)
    private Announcement.Priority parsePriority(String priority) {
        if (priority == null || priority.isEmpty()) return Announcement.Priority.NORMAL;
        try {
            return Announcement.Priority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Announcement.Priority.NORMAL; // fallback
        }
    }

    @Transactional
    public Announcement create(AnnouncementRequest request) {
        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .priority(parsePriority(request.getPriority()))
                .expiresAt(request.getExpiresAt())
                .createdBy("Admin")
                .build();
        return announcementRepository.save(announcement);
    }

    @Transactional
    public Announcement update(Long id, AnnouncementRequest request) {
        Announcement announcement = getById(id);
        if (request.getTitle() != null) announcement.setTitle(request.getTitle());
        if (request.getMessage() != null) announcement.setMessage(request.getMessage());
        if (request.getIsActive() != null) announcement.setIsActive(request.getIsActive());
        if (request.getPriority() != null) announcement.setPriority(parsePriority(request.getPriority()));
        if (request.getExpiresAt() != null) announcement.setExpiresAt(request.getExpiresAt());
        return announcementRepository.save(announcement);
    }

    @Transactional
    public void delete(Long id) {
        announcementRepository.deleteById(id);
    }
}