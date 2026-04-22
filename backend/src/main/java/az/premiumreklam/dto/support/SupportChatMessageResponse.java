package az.premiumreklam.dto.support;

import az.premiumreklam.entity.SupportChatMessage;
import az.premiumreklam.enums.SupportSenderRole;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class SupportChatMessageResponse {
    Long id;
    Long userId;
    SupportSenderRole senderRole;
    String content;
    String attachmentMimeType;
    String attachmentFileName;
    Long attachmentSizeBytes;
    boolean hasAttachment;
    String attachmentBase64;
    Instant createdAt;
    boolean readByUser;
    boolean readByAdmin;

    public static SupportChatMessageResponse fromEntity(SupportChatMessage m, boolean includeAttachmentPayload) {
        boolean has = m.getAttachmentBase64() != null && !m.getAttachmentBase64().isBlank();
        return SupportChatMessageResponse.builder()
                .id(m.getId())
                .userId(m.getUserId())
                .senderRole(m.getSenderRole())
                .content(m.getContent() != null ? m.getContent() : "")
                .attachmentMimeType(m.getAttachmentMimeType())
                .attachmentFileName(m.getAttachmentFileName())
                .attachmentSizeBytes(m.getAttachmentSizeBytes())
                .hasAttachment(has)
                .attachmentBase64(includeAttachmentPayload && has ? m.getAttachmentBase64() : null)
                .createdAt(m.getCreatedAt())
                .readByUser(Boolean.TRUE.equals(m.getReadByUser()))
                .readByAdmin(Boolean.TRUE.equals(m.getReadByAdmin()))
                .build();
    }
}
