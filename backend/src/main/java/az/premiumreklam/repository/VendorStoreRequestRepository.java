package az.premiumreklam.repository;

import az.premiumreklam.entity.VendorStoreRequest;
import az.premiumreklam.enums.VendorStoreRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorStoreRequestRepository extends JpaRepository<VendorStoreRequest, Long> {

    void deleteByUser_Id(Long userId);

    boolean existsByUser_IdAndStatus(Long userId, VendorStoreRequestStatus status);

    List<VendorStoreRequest> findAllByOrderByCreatedAtDesc();

    List<VendorStoreRequest> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
