package az.premiumreklam.dto.announcement;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnnouncementRequest {
    private String title;
    private String message;
    private String priority;
    private Boolean isActive;
    /**
     * JSON string: HTML {@code type=date} → {@code yyyy-MM-dd}, tam ISO vaxt, və ya {@code null}.
     * Jackson heç vaxt {@code LocalDateTime} parse etmir — server xətası olmur.
     */
    private String expiresAt;
}