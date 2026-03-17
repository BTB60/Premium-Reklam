package az.premiumreklam.controller;

import az.premiumreklam.entity.Payment;
import az.premiumreklam.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MUHASIB')")
    public List<Payment> getAll() {
        return paymentService.getAll();
    }
}
