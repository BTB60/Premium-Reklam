package az.premiumreklam.controller;

import az.premiumreklam.dto.notification.InAppNotificationResponse;
import az.premiumreklam.service.InAppNotificationApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class InAppNotificationController {

    private final InAppNotificationApiService inAppNotificationApiService;

    @GetMapping
    public List<InAppNotificationResponse> list(Authentication authentication) {
        return inAppNotificationApiService.listForUser(authentication.getName());
    }

    @PostMapping("/mark-all-as-read")
    public Map<String, Object> markAllAsRead(Authentication authentication) {
        int updated = inAppNotificationApiService.markAllReadForUser(authentication.getName());
        return Map.of("updated", updated);
    }
}
