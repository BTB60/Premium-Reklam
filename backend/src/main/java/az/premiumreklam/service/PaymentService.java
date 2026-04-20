package az.premiumreklam.service;

import az.premiumreklam.entity.Order;
import az.premiumreklam.entity.Payment;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.PaymentStatus;
import az.premiumreklam.repository.OrderRepository;
import az.premiumreklam.repository.PaymentRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public Payment create(Payment payment) {
        return paymentRepository.save(payment);
    }

    public List<Payment> getAll() {
        return paymentRepository.findAll();
    }

    @Transactional
    public Order addPayment(Long orderId, BigDecimal amount) {
        Order order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));

        if (order.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new RuntimeException("Ləğv edilmiş sifarişə ödəniş edilə bilməz");
        }

        BigDecimal previousPaidAmount = order.getPaidAmount() == null ? BigDecimal.ZERO : order.getPaidAmount();
        BigDecimal newPaidAmount = previousPaidAmount.add(amount);
        BigDecimal maxAllowed = order.getTotalAmount();

        if (newPaidAmount.compareTo(maxAllowed) > 0) {
            newPaidAmount = maxAllowed;
        }

        BigDecimal newRemainingAmount = maxAllowed.subtract(newPaidAmount);

        PaymentStatus newStatus;
        if (newRemainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            newStatus = PaymentStatus.PAID;
        } else {
            newStatus = PaymentStatus.PARTIAL;
        }

        order.setPaidAmount(newPaidAmount);
        order.setRemainingAmount(newRemainingAmount);
        order.setPaymentStatus(newStatus);

        orderRepository.save(order);

        // Real ödənən hissə qədər istifadəçi borcunu azaldırıq.
        BigDecimal paidDelta = newPaidAmount.subtract(previousPaidAmount);
        if (paidDelta.compareTo(BigDecimal.ZERO) > 0 && order.getUser() != null) {
            User user = userRepository.findById(order.getUser().getId())
                    .orElse(null);
            if (user != null) {
                BigDecimal currentDebt = user.getTotalDebt() == null ? BigDecimal.ZERO : user.getTotalDebt();
                BigDecimal newDebt = currentDebt.subtract(paidDelta);
                if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
                    newDebt = BigDecimal.ZERO;
                }
                user.setTotalDebt(newDebt);
                if (newDebt.compareTo(BigDecimal.ZERO) == 0) {
                    user.setOrderBlocked(false);
                    user.setNextWeeklyDueDate(null);
                } else {
                    user.setNextWeeklyDueDate(LocalDate.now().plusDays(7));
                }
                userRepository.save(user);
            }
        }

        return orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
    }
}
