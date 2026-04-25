package az.premiumreklam.dto.order;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminOrderMetaRequest {
    private LocalDateTime estimatedReadyAt;
    private String internalAdminNote;
}
