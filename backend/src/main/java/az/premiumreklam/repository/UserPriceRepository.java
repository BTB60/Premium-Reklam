package az.premiumreklam.repository;

import az.premiumreklam.entity.UserPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPriceRepository extends JpaRepository<UserPrice, Long> {
    
    List<UserPrice> findByUserIdAndIsActiveTrue(Long userId);
    
    Optional<UserPrice> findByUserIdAndProductIdAndIsActiveTrue(Long userId, Long productId);
    
    List<UserPrice> findByUserId(Long userId);
    
    List<UserPrice> findByProductId(Long productId);
    
    void deleteByUserId(Long userId);
    
    void deleteByProductId(Long productId);
}
