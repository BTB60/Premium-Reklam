package az.premiumreklam.entity;

import az.premiumreklam.enums.SupportSenderRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "support_chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SupportSenderRole senderRole;

    @Column(length = 12_000)
    private String content;

    /** Base64 (data URL yox, təmiz base64) — max ~4MB fayl üçün */
    @Column(columnDefinition = "TEXT")
    private String attachmentBase64;

    @Column(length = 120)
    private String attachmentMimeType;

    @Column(length = 255)
    private String attachmentFileName;

    private Long attachmentSizeBytes;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Boolean readByUser;

    @Column(nullable = false)
    private Boolean readByAdmin;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (readByUser == null) readByUser = false;
        if (readByAdmin == null) readByAdmin = false;
        if (content == null) content = "";
    }
}
