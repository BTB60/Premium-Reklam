package az.premiumreklam.service;

import az.premiumreklam.dto.coupon.CouponResponse;
import az.premiumreklam.dto.coupon.CreateCouponRequest;
import az.premiumreklam.entity.PromoCoupon;
import az.premiumreklam.repository.PromoCouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromoCouponService {
    private final PromoCouponRepository promoCouponRepository;

    @Transactional
    public CouponResponse create(CreateCouponRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (promoCouponRepository.existsByCodeIgnoreCase(code)) {
            throw new RuntimeException("Bu kupon artıq mövcuddur");
        }
        PromoCoupon coupon = promoCouponRepository.save(PromoCoupon.builder()
                .code(code)
                .discountPercent(request.getDiscountPercent())
                .minOrderAmount(request.getMinOrderAmount())
                .maxUses(request.getMaxUses())
                .expiresAt(request.getExpiresAt())
                .active(true)
                .build());
        return CouponResponse.from(coupon);
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> list() {
        return promoCouponRepository.findAll().stream()
                .map(CouponResponse::from)
                .toList();
    }

    @Transactional
    public CouponResponse toggle(Long id, boolean active) {
        PromoCoupon c = promoCouponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kupon tapılmadı"));
        c.setActive(active);
        return CouponResponse.from(promoCouponRepository.save(c));
    }

    @Transactional
    public BigDecimal calculateAndConsumeDiscount(String couponCode, BigDecimal subtotal) {
        if (couponCode == null || couponCode.isBlank()) return BigDecimal.ZERO;
        PromoCoupon coupon = promoCouponRepository.findByCodeIgnoreCase(couponCode.trim())
                .orElseThrow(() -> new RuntimeException("Kupon tapılmadı"));
        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new RuntimeException("Kupon aktiv deyil");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Kuponun müddəti bitib");
        }
        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new RuntimeException("Kupon limiti bitib");
        }
        if (coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new RuntimeException("Kupon üçün minimum sifariş məbləği ödənmir");
        }

        BigDecimal discount = subtotal.multiply(coupon.getDiscountPercent()).divide(BigDecimal.valueOf(100));
        coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
        promoCouponRepository.save(coupon);
        return discount;
    }
}
