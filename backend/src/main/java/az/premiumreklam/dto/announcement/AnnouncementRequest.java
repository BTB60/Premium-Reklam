package az.premiumreklam.dto.announcement;

import az.premiumreklam.entity.Announcement;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class AnnouncementRequest {
    private String title;
    private String message;
    private Boolean isActive;
    private String priority;
    private LocalDateTime expiresAt;
}