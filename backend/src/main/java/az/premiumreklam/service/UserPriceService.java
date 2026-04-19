package az.premiumreklam.service;

import az.premiumreklam.dto.product.UserPriceRequest;
import az.premiumreklam.entity.Product;
import az.premiumreklam.entity.User;
import az.premiumreklam.entity.UserPrice;
import az.premiumreklam.repository.ProductRepository;
import az.premiumreklam.repository.UserPriceRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserPriceService {

    private final UserPriceRepository userPriceRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<UserPrice> getUserPrices(Long userId) {
        return userPriceRepository.findByUser_IdAndIsActiveTrue(userId);
    }

    public List<UserPrice> getProductPrices(Long productId) {
        return userPriceRepository.findByProduct_Id(productId);
    }

    public BigDecimal getPriceForUser(Long userId, Long productId) {
        Optional<UserPrice> customPrice = userPriceRepository
                .findByUser_IdAndProduct_IdAndIsActiveTrue(userId, productId);

        if (customPrice.isPresent()) {
            UserPrice up = customPrice.get();
            if (up.getDiscountPercent() != null && up.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
                Product product = up.getProduct();
                BigDecimal base = product.getSalePrice() != null ? product.getSalePrice() : BigDecimal.ZERO;
                BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                        up.getDiscountPercent().divide(BigDecimal.valueOf(100)));
                return base.multiply(discountMultiplier);
            }
            return up.getCustomPrice();
        }

        return productRepository.findById(productId)
                .map(p -> p.getSalePrice() != null ? p.getSalePrice() : BigDecimal.ZERO)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public UserPrice setUserPrice(UserPriceRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Məhsul tapılmadı"));

        Optional<UserPrice> existing = userPriceRepository
                .findByUser_IdAndProduct_IdAndIsActiveTrue(request.getUserId(), request.getProductId());

        if (existing.isPresent()) {
            UserPrice up = existing.get();
            up.setCustomPrice(request.getCustomPrice());
            up.setDiscountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO);
            return userPriceRepository.save(up);
        }

        UserPrice userPrice = UserPrice.builder()
                .user(user)
                .product(product)
                .customPrice(request.getCustomPrice())
                .discountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO)
                .isActive(true)
                .build();

        return userPriceRepository.save(userPrice);
    }

    @Transactional
    public void deleteUserPrice(Long userId, Long productId) {
        Optional<UserPrice> existing = userPriceRepository
                .findByUser_IdAndProduct_IdAndIsActiveTrue(userId, productId);

        if (existing.isPresent()) {
            UserPrice up = existing.get();
            up.setIsActive(false);
            userPriceRepository.save(up);
        }
    }
}
