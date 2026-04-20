package az.premiumreklam.controller;

import az.premiumreklam.dto.payment.ClientPaymentRequestResponse;
import az.premiumreklam.service.ClientPaymentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminClientPaymentController {

    private final ClientPaymentRequestService clientPaymentRequestService;

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<ClientPaymentRequestResponse> pending() {
        return clientPaymentRequestService.listPending();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ClientPaymentRequestResponse approve(@PathVariable Long id) {
        return wrap(() -> clientPaymentRequestService.approve(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ClientPaymentRequestResponse reject(@PathVariable Long id) {
        return wrap(() -> clientPaymentRequestService.reject(id));
    }

    private ClientPaymentRequestResponse wrap(Supplier<ClientPaymentRequestResponse> action) {
        try {
            return action.get();
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }
}
