package az.premiumreklam.repository;

import az.premiumreklam.entity.UserPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPriceRepository extends JpaRepository<UserPrice, UUID> {
    
    List<UserPrice> findByUserIdAndIsActiveTrue(UUID userId);
    
    Optional<UserPrice> findByUserIdAndProductIdAndIsActiveTrue(UUID userId, UUID productId);
    
    List<UserPrice> findByUserId(UUID userId);
    
    List<UserPrice> findByProductId(UUID productId);
    
    void deleteByUserId(UUID userId);
    
    void deleteByProductId(UUID productId);
}
