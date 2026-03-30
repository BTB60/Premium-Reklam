package az.premiumreklam.dto.announcement;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class AnnouncementRequest {
    private String title;
    private String message;
    private String priority;
    private Boolean isActive;
    private LocalDateTime expiresAt;
}