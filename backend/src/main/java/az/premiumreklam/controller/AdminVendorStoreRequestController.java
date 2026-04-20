package az.premiumreklam.controller;

import az.premiumreklam.dto.vendor.RejectVendorStoreRequestBody;
import az.premiumreklam.dto.vendor.VendorStoreRequestResponse;
import az.premiumreklam.service.VendorStoreRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/store-requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
public class AdminVendorStoreRequestController {

    private final VendorStoreRequestService vendorStoreRequestService;

    @GetMapping
    public List<VendorStoreRequestResponse> list() {
        return vendorStoreRequestService.listAllForAdmin();
    }

    @PostMapping("/{id}/approve")
    public VendorStoreRequestResponse approve(@PathVariable Long id, Authentication authentication) {
        try {
            return vendorStoreRequestService.approve(id, authentication.getName());
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public VendorStoreRequestResponse reject(
            @PathVariable Long id,
            @RequestBody(required = false) RejectVendorStoreRequestBody body,
            Authentication authentication) {
        try {
            return vendorStoreRequestService.reject(id, authentication.getName(),
                    body != null ? body.getReason() : null);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage());
        }
    }
}
