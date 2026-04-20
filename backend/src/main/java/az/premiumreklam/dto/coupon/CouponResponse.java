package az.premiumreklam.dto.coupon;

import az.premiumreklam.entity.PromoCoupon;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CouponResponse {
    private Long id;
    private String code;
    private BigDecimal discountPercent;
    private BigDecimal minOrderAmount;
    private Integer maxUses;
    private Integer usedCount;
    private Boolean active;
    private LocalDateTime expiresAt;

    public static CouponResponse from(PromoCoupon c) {
        return CouponResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .discountPercent(c.getDiscountPercent())
                .minOrderAmount(c.getMinOrderAmount())
                .maxUses(c.getMaxUses())
                .usedCount(c.getUsedCount())
                .active(c.getActive())
                .expiresAt(c.getExpiresAt())
                .build();
    }
}
