package az.premiumreklam.dto.order;

import az.premiumreklam.enums.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OrderItemRequest {
    private Long productId;
    private String productName;
    private ProductUnit unit;
    private BigDecimal quantity;
    private BigDecimal width;
    private BigDecimal height;
    private BigDecimal unitPrice;
    private String note;
}
