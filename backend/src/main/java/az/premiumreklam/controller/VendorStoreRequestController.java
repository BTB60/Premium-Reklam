package az.premiumreklam.controller;

import az.premiumreklam.dto.vendor.CreateVendorStoreRequest;
import az.premiumreklam.dto.vendor.VendorStoreRequestResponse;
import az.premiumreklam.service.VendorStoreRequestService;
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
@RequestMapping("/api/vendor/store-requests")
@RequiredArgsConstructor
@Validated
public class VendorStoreRequestController {

    private final VendorStoreRequestService vendorStoreRequestService;

    private static final Set<String> CLIENT_ROLES = Set.of(
            "ROLE_DECORCU", "ROLE_DECORATOR", "ROLE_REKLAMCI", "ROLE_VENDOR");

    private static void assertCustomerRole(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(CLIENT_ROLES::contains);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bu əməliyyat yalnız müştəri (dekorçu/vendor) hesabı üçündür");
        }
    }

    @PostMapping
    public VendorStoreRequestResponse create(
            @Valid @RequestBody CreateVendorStoreRequest body,
            Authentication authentication) {
        assertCustomerRole(authentication);
        try {
            return vendorStoreRequestService.create(authentication.getName(), body);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/mine")
    public List<VendorStoreRequestResponse> mine(Authentication authentication) {
        assertCustomerRole(authentication);
        return vendorStoreRequestService.listMine(authentication.getName());
    }
}
