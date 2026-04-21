package az.premiumreklam.service;

import az.premiumreklam.dto.realtime.RealtimeEventDto;
import az.premiumreklam.dto.vendor.CreateVendorStoreRequest;
import az.premiumreklam.dto.vendor.VendorStoreRequestResponse;
import az.premiumreklam.entity.InAppNotification;
import az.premiumreklam.entity.User;
import az.premiumreklam.entity.VendorStoreRequest;
import az.premiumreklam.enums.InAppNotificationType;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.VendorStoreRequestStatus;
import az.premiumreklam.repository.InAppNotificationRepository;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.repository.VendorStoreRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorStoreRequestService {

    private final VendorStoreRequestRepository storeRequestRepository;
    private final UserRepository userRepository;
    private final InAppNotificationRepository notificationRepository;
    private final RealtimePushService realtimePushService;
    private final ObjectMapper objectMapper;

    @Transactional
    public VendorStoreRequestResponse create(String username, CreateVendorStoreRequest body) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        if (storeRequestRepository.existsByUser_IdAndStatus(user.getId(), VendorStoreRequestStatus.PENDING)) {
            throw new IllegalStateException("Sizin artıq gözləyən mağaza müraciətiniz var");
        }

        String categoriesJson;
        try {
            categoriesJson = objectMapper.writeValueAsString(body.getCategories());
        } catch (Exception e) {
            throw new IllegalArgumentException("Kateqoriyalar saxlanıla bilmədi");
        }

        VendorStoreRequest entity = VendorStoreRequest.builder()
                .user(user)
                .clientReferenceId(body.getClientReferenceId())
                .storeName(body.getStoreName().trim())
                .description(body.getDescription().trim())
                .address(body.getAddress().trim())
                .phone(body.getPhone().trim())
                .email(body.getEmail() != null ? body.getEmail().trim() : null)
                .vendorDisplayName(body.getVendorDisplayName().trim())
                .vendorPhone(body.getVendorPhone() != null ? body.getVendorPhone().trim() : null)
                .categoriesJson(categoriesJson)
                .status(VendorStoreRequestStatus.PENDING)
                .build();

        entity = storeRequestRepository.save(entity);
        notifyAdminsNewRequest(entity);
        return VendorStoreRequestResponse.from(entity, objectMapper);
    }

    private void notifyAdminsNewRequest(VendorStoreRequest entity) {
        User applicant = entity.getUser();
        String msg = applicant.getFullName() + " — yeni mağaza müraciəti: " + entity.getStoreName();

        realtimePushService.notifyAdmins(RealtimeEventDto.builder()
                .event("STORE_REQUEST_PENDING")
                .message(msg)
                .soundProfile("admin")
                .dedupeKey("store-req-" + entity.getId())
                .build());

        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            notificationRepository.save(InAppNotification.builder()
                    .user(admin)
                    .message(msg)
                    .isRead(false)
                    // Postgres check constraint köhnə deploylarda STORE_REQUEST_PENDING qəbul etməyə bilər.
                    // Realtime event ayrı qalır, DB üçün SYSTEM saxlayırıq.
                    .type(InAppNotificationType.SYSTEM)
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public List<VendorStoreRequestResponse> listAllForAdmin() {
        return storeRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(e -> VendorStoreRequestResponse.from(e, objectMapper))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VendorStoreRequestResponse> listMine(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));
        return storeRequestRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(e -> VendorStoreRequestResponse.from(e, objectMapper))
                .toList();
    }

    @Transactional
    public VendorStoreRequestResponse approve(Long id, String processedByLabel) {
        VendorStoreRequest req = storeRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Müraciət tapılmadı"));
        if (req.getStatus() != VendorStoreRequestStatus.PENDING) {
            throw new IllegalStateException("Müraciət artıq emal olunub");
        }
        req.setStatus(VendorStoreRequestStatus.APPROVED);
        req.setProcessedBy(processedByLabel != null ? processedByLabel : "admin");
        req.setProcessedAt(LocalDateTime.now());
        storeRequestRepository.save(req);

        User user = req.getUser();
        realtimePushService.notifyUser(user.getUsername(), RealtimeEventDto.builder()
                .event("STORE_REQUEST_APPROVED")
                .message("Mağaza müraciətiniz təsdiqləndi: " + req.getStoreName())
                .soundProfile("user")
                .dedupeKey("store-approved-" + req.getId())
                .build());

        return VendorStoreRequestResponse.from(req, objectMapper);
    }

    @Transactional
    public VendorStoreRequestResponse reject(Long id, String processedByLabel, String reason) {
        VendorStoreRequest req = storeRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Müraciət tapılmadı"));
        if (req.getStatus() != VendorStoreRequestStatus.PENDING) {
            throw new IllegalStateException("Müraciət artıq emal olunub");
        }
        req.setStatus(VendorStoreRequestStatus.REJECTED);
        req.setRejectionReason(reason);
        req.setProcessedBy(processedByLabel != null ? processedByLabel : "admin");
        req.setProcessedAt(LocalDateTime.now());
        storeRequestRepository.save(req);

        User user = req.getUser();
        realtimePushService.notifyUser(user.getUsername(), RealtimeEventDto.builder()
                .event("STORE_REQUEST_REJECTED")
                .message("Mağaza müraciətiniz rədd edildi: " + req.getStoreName())
                .soundProfile("user")
                .dedupeKey("store-rejected-" + req.getId())
                .build());

        return VendorStoreRequestResponse.from(req, objectMapper);
    }
}
