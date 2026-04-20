package az.premiumreklam.repository;

import az.premiumreklam.entity.ClientPaymentRequest;
import az.premiumreklam.enums.ClientPaymentRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClientPaymentRequestRepository extends JpaRepository<ClientPaymentRequest, Long> {

    List<ClientPaymentRequest> findByStatusOrderByCreatedAtDesc(ClientPaymentRequestStatus status);

    List<ClientPaymentRequest> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
