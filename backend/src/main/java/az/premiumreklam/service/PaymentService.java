package az.premiumreklam.service;

import az.premiumreklam.entity.Order;
import az.premiumreklam.entity.Payment;
import az.premiumreklam.enums.PaymentStatus;
import az.premiumreklam.repository.OrderRepository;
import az.premiumreklam.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public Payment create(Payment payment) {
        return paymentRepository.save(payment);
    }

    public List<Payment> getAll() {
        return paymentRepository.findAll();
    }

    @Transactional
    public Order addPayment(UUID orderId, BigDecimal amount) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));

        if (order.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new RuntimeException("Ləğv edilmiş sifarişə ödəniş edilə bilməz");
        }

        BigDecimal newPaidAmount = order.getPaidAmount().add(amount);
        BigDecimal maxAllowed = order.getTotalAmount();
        
        // Don't allow overpayment
        if (newPaidAmount.compareTo(maxAllowed) > 0) {
            newPaidAmount = maxAllowed;
        }

        BigDecimal newRemainingAmount = maxAllowed.subtract(newPaidAmount);

        // Update payment status
        PaymentStatus newStatus;
        if (newRemainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            newStatus = PaymentStatus.PAID;
        } else {
            newStatus = PaymentStatus.PARTIAL;
        }

        order.setPaidAmount(newPaidAmount);
        order.setRemainingAmount(newRemainingAmount);
        order.setPaymentStatus(newStatus);

        return orderRepository.save(order);
    }
}
