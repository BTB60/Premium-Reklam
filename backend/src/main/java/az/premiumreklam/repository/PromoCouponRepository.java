package az.premiumreklam.repository;

import az.premiumreklam.entity.PromoCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PromoCouponRepository extends JpaRepository<PromoCoupon, Long> {
    Optional<PromoCoupon> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}
