package az.premiumreklam.dto.order;

import az.premiumreklam.enums.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class OrderItemRequest {
    private UUID productId;
    private String productName;
    private ProductUnit unit;
    private BigDecimal quantity;
    private BigDecimal width;
    private BigDecimal height;
    private BigDecimal unitPrice;
    private String note;
}
