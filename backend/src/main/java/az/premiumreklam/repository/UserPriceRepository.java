package az.premiumreklam.repository;

import az.premiumreklam.entity.UserPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPriceRepository extends JpaRepository<UserPrice, Long> {

    List<UserPrice> findByUser_IdAndIsActiveTrue(Long userId);

    Optional<UserPrice> findByUser_IdAndProduct_IdAndIsActiveTrue(Long userId, Long productId);

    List<UserPrice> findByUser_Id(Long userId);

    List<UserPrice> findByProduct_Id(Long productId);

    void deleteByUser_Id(Long userId);

    void deleteByProduct_Id(Long productId);
}
