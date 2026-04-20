package az.premiumreklam.dto.realtime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeEventDto {
    private String event;
    private Long notificationId;
    private Long paymentRequestId;
    private String message;
    /** "admin" | "user" — frontend uyğun səs faylı seçir */
    private String soundProfile;
    /** Toast deduplication üçün unikal açar */
    private String dedupeKey;
}
