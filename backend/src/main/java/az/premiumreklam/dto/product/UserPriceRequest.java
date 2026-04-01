package az.premiumreklam.dto.product;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPriceRequest {
    private UUID userId;
    private UUID productId;
    private BigDecimal customPrice;
    private BigDecimal discountPercent;
}
