package az.premiumreklam.controller;

import az.premiumreklam.dto.payment.ClientPaymentRequestResponse;
import az.premiumreklam.dto.payment.CreateClientPaymentRequest;
import az.premiumreklam.service.ClientPaymentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/payment-requests")
@RequiredArgsConstructor
@Validated
public class ClientPaymentRequestController {

    private final ClientPaymentRequestService clientPaymentRequestService;

    @PostMapping
    public ClientPaymentRequestResponse create(
            @Valid @RequestBody CreateClientPaymentRequest body,
            Authentication authentication) {
        assertCustomerRole(authentication);
        try {
            return clientPaymentRequestService.createForCustomer(
                    authentication.getName(),
                    body.getAmount(),
                    body.getReceiptImageData(),
                    body.getReceiptFileName()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/my")
    public List<ClientPaymentRequestResponse> myRequests(Authentication authentication) {
        assertCustomerRole(authentication);
        return clientPaymentRequestService.listMine(authentication.getName());
    }

    private static final Set<String> CLIENT_ROLES_FOR_PAYMENT_REQUEST = Set.of(
            "ROLE_DECORCU", "ROLE_DECORATOR", "ROLE_VENDOR");

    private static void assertCustomerRole(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(CLIENT_ROLES_FOR_PAYMENT_REQUEST::contains);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bu əməliyyat yalnız müştəri (dekorçu/vendor) hesabı üçündür");
        }
    }
}
