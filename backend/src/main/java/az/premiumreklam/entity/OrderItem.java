package az.premiumreklam.entity;

import az.premiumreklam.enums.ProductUnit;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    @JsonIgnore
    private Product product;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductUnit unit = ProductUnit.PIECE;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(precision = 10, scale = 2)
    private BigDecimal width;

    @Column(precision = 10, scale = 2)
    private BigDecimal height;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal area = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.unit == null) this.unit = ProductUnit.PIECE;
        if (this.quantity == null) this.quantity = BigDecimal.ONE;
        if (this.area == null) this.area = BigDecimal.ZERO;
        if (this.unitPrice == null) this.unitPrice = BigDecimal.ZERO;
        if (this.lineTotal == null) this.lineTotal = BigDecimal.ZERO;
    }

    @PreUpdate
    public void preUpdate() {
        calculateFields();
    }

    public void calculateFields() {
        if (this.unit == ProductUnit.M2) {
            BigDecimal safeWidth = this.width != null ? this.width : BigDecimal.ZERO;
            BigDecimal safeHeight = this.height != null ? this.height : BigDecimal.ZERO;
            BigDecimal safeQuantity = this.quantity != null ? this.quantity : BigDecimal.ONE;
            BigDecimal safeUnitPrice = this.unitPrice != null ? this.unitPrice : BigDecimal.ZERO;

            this.area = safeWidth.multiply(safeHeight);
            this.lineTotal = this.area.multiply(safeUnitPrice).multiply(safeQuantity);
        } else {
            BigDecimal safeQuantity = this.quantity != null ? this.quantity : BigDecimal.ONE;
            BigDecimal safeUnitPrice = this.unitPrice != null ? this.unitPrice : BigDecimal.ZERO;

            this.area = BigDecimal.ZERO;
            this.lineTotal = safeQuantity.multiply(safeUnitPrice);
        }
    }
}
