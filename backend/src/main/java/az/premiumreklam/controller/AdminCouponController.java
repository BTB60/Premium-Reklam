package az.premiumreklam.controller;

import az.premiumreklam.dto.coupon.CouponResponse;
import az.premiumreklam.dto.coupon.CreateCouponRequest;
import az.premiumreklam.service.PromoCouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {
    private final PromoCouponService promoCouponService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse create(@Valid @RequestBody CreateCouponRequest request) {
        return promoCouponService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<CouponResponse> list() {
        return promoCouponService.list();
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse setActive(@PathVariable Long id, @RequestParam boolean active) {
        return promoCouponService.toggle(id, active);
    }
}
