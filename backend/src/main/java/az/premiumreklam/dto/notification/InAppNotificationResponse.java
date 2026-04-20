package az.premiumreklam.dto.notification;

import az.premiumreklam.entity.InAppNotification;
import az.premiumreklam.enums.InAppNotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InAppNotificationResponse {
    private Long id;
    private String message;
    private boolean isRead;
    private InAppNotificationType type;
    private LocalDateTime createdAt;

    public static InAppNotificationResponse from(InAppNotification n) {
        return InAppNotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .isRead(n.isRead())
                .type(n.getType())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
