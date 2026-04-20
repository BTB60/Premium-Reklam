package az.premiumreklam.service;

import az.premiumreklam.dto.notification.InAppNotificationResponse;
import az.premiumreklam.repository.InAppNotificationRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InAppNotificationApiService {

    private final InAppNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<InAppNotificationResponse> listForUser(String username) {
        return userRepository.findByUsername(username)
                .map(u -> notificationRepository.findByUser_IdOrderByCreatedAtDesc(u.getId()).stream()
                        .map(InAppNotificationResponse::from)
                        .toList())
                .orElse(List.of());
    }

    @Transactional
    public int markAllReadForUser(String username) {
        return userRepository.findByUsername(username)
                .map(u -> notificationRepository.markAllReadForUser(u.getId()))
                .orElse(0);
    }
}
