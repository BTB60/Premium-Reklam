package az.premiumreklam.dto.announcement;

import az.premiumreklam.entity.Announcement;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String message;
    private Boolean isActive;
    private String priority;
    private String createdAt;
    private String updatedAt;
    private String expiresAt;

    public static AnnouncementResponse fromEntity(Announcement announcement) {
        if (announcement == null) return null;
        
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setTitle(announcement.getTitle());
        response.setMessage(announcement.getMessage());
        response.setIsActive(announcement.getIsActive());
        response.setPriority(announcement.getPriority() != null 
            ? announcement.getPriority().name().toLowerCase() 
            : "normal");
        response.setCreatedAt(announcement.getCreatedAt() != null 
            ? announcement.getCreatedAt().toString() 
            : null);
        response.setUpdatedAt(announcement.getUpdatedAt() != null 
            ? announcement.getUpdatedAt().toString() 
            : null);
        response.setExpiresAt(announcement.getExpiresAt() != null 
            ? announcement.getExpiresAt().toString() 
            : null);
        return response;
    }
}