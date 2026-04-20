package az.premiumreklam.dto.product;

import az.premiumreklam.entity.Product;
import az.premiumreklam.enums.ProductUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Kataloq üçün JSON: alış qiyməti (purchasePrice) daxil deyil — yalnız admin/subadmin tam entity görür.
 */
@Getter
@Builder
@AllArgsConstructor
public class ProductPublicResponse {

    private Long id;
    private String name;
    private String sku;
    private String category;
    private String description;
    private ProductUnit unit;
    private BigDecimal salePrice;
    private BigDecimal stockQuantity;
    private BigDecimal minStockLevel;
    private BigDecimal width;
    private BigDecimal height;
    private String status;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductPublicResponse fromEntity(Product p) {
        return ProductPublicResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .category(p.getCategory())
                .description(p.getDescription())
                .unit(p.getUnit())
                .salePrice(p.getSalePrice())
                .stockQuantity(p.getStockQuantity())
                .minStockLevel(p.getMinStockLevel())
                .width(p.getWidth())
                .height(p.getHeight())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .imageUrl(p.getImageUrl())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
