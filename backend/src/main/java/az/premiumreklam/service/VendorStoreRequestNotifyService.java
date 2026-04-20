package az.premiumreklam.service;

import az.premiumreklam.dto.realtime.RealtimeEventDto;
import az.premiumreklam.dto.vendor.VendorStoreRequestNotifyRequest;
import az.premiumreklam.entity.InAppNotification;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.InAppNotificationType;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.repository.InAppNotificationRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorStoreRequestNotifyService {

    private final UserRepository userRepository;
    private final InAppNotificationRepository notificationRepository;
    private final RealtimePushService realtimePushService;

    @Transactional
    public void notifyAdminsOfNewRequest(VendorStoreRequestNotifyRequest body) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User applicant = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        String safeName = body.getStoreName().trim();
        String msg = applicant.getFullName() + " — yeni mağaza müraciəti: " + safeName;

        realtimePushService.notifyAdmins(RealtimeEventDto.builder()
                .event("STORE_REQUEST_PENDING")
                .message(msg)
                .soundProfile("admin")
                .dedupeKey("store-req-" + body.getRequestId().trim())
                .build());

        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            InAppNotification n = InAppNotification.builder()
                    .user(admin)
                    .message(msg)
                    .isRead(false)
                    .type(InAppNotificationType.STORE_REQUEST_PENDING)
                    .build();
            notificationRepository.save(n);
        }
    }
}
