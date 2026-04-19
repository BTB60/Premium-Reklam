package az.premiumreklam.dto.product;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UserPriceRequest {
    private Long userId;
    private Long productId;
    private BigDecimal customPrice;
    private BigDecimal discountPercent;
}
