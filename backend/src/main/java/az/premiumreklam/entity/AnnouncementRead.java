package az.premiumreklam.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "announcement_reads", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "announcement_id"}, name = "uk_user_announcement")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementRead {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID userId;

    @Column(name = "announcement_id", nullable = false)
    private Long announcementId;

    @Column(name = "read_at", nullable = false)
    private LocalDateTime readAt;

    @PrePersist
    public void prePersist() {
        if (readAt == null) readAt = LocalDateTime.now();
    }
}