package az.premiumreklam.repository;

import az.premiumreklam.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    void deleteByOrder_Id(Long orderId);

    void deleteByUser_Id(Long userId);
}
