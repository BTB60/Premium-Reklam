package az.premiumreklam.controller;

import az.premiumreklam.dto.order.OrderResponse;
import az.premiumreklam.entity.Payment;
import az.premiumreklam.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('KASSIR') or hasRole('MUHASIB')")
    public Payment create(@RequestBody Payment payment) {
        return paymentService.create(payment);
    }

    @PostMapping("/order/{orderId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('KASSIR') or hasRole('MUHASIB')")
    public ResponseEntity<?> addPaymentToOrder(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            return ResponseEntity.ok(OrderResponse.fromEntity(paymentService.addPayment(orderId, amount)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MUHASIB')")
    public List<Payment> getAll() {
        return paymentService.getAll();
    }
}
