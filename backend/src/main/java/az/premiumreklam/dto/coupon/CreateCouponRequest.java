package az.premiumreklam.dto.coupon;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateCouponRequest {
    @NotBlank
    private String code;

    @DecimalMin(value = "0.01")
    @DecimalMax(value = "100.00")
    private BigDecimal discountPercent;

    private BigDecimal minOrderAmount;
    private Integer maxUses;
    private LocalDateTime expiresAt;
}
