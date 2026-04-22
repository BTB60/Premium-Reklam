package az.premiumreklam.dto.support;

import lombok.Data;

@Data
public class SupportChatMessageRequest {
    /** Boş ola bilər, əgər yalnız əlavə göndərilirsə */
    private String content;
    /** Saf base64 (data: URL prefiksi olmadan) */
    private String attachmentBase64;
    private String attachmentMimeType;
    private String attachmentFileName;
}
