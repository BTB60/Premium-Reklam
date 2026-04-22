package az.premiumreklam.dto.support;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class SupportThreadSummaryResponse {
    Long userId;
    String username;
    String fullName;
    String lastPreview;
    Instant lastMessageAt;
    long unreadForAdmin;
}
