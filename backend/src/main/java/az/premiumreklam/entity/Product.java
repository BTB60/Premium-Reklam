package az.premiumreklam.entity;

import az.premiumreklam.enums.ProductStatus;
import az.premiumreklam.enums.ProductUnit;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 80)
    private String sku;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductUnit unit = ProductUnit.PIECE;

    @Column(name = "purchase_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "sale_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal salePrice = BigDecimal.ZERO;

    @Column(name = "stock_quantity", precision = 12, scale = 2, nullable = false)
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "min_stock_level", precision = 12, scale = 2, nullable = false)
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal width;

    @Column(precision = 10, scale = 2)
    private BigDecimal height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (purchasePrice == null) purchasePrice = BigDecimal.ZERO;
        if (salePrice == null) salePrice = BigDecimal.ZERO;
        if (stockQuantity == null) stockQuantity = BigDecimal.ZERO;
        if (minStockLevel == null) minStockLevel = BigDecimal.ZERO;
        if (unit == null) unit = ProductUnit.PIECE;
        if (status == null) status = ProductStatus.ACTIVE;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
