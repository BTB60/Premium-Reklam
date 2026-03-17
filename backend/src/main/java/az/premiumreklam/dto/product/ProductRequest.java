package az.premiumreklam.dto.product;

import az.premiumreklam.enums.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {
    private String name;
    private String sku;
    private String category;
    private String description;
    private ProductUnit unit;
    private BigDecimal purchasePrice;
    private BigDecimal salePrice;
    private BigDecimal stockQuantity;
    private BigDecimal minStockLevel;
    private BigDecimal width;
    private BigDecimal height;
}
