package az.premiumreklam.dto.product;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPriceRequest {
    private Long userId;
    private Long productId;
    private BigDecimal customPrice;
    private BigDecimal discountPercent;
}
