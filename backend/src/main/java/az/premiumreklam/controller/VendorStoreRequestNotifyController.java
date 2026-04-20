package az.premiumreklam.controller;

import az.premiumreklam.dto.vendor.VendorStoreRequestNotifyRequest;
import az.premiumreklam.service.VendorStoreRequestNotifyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendor/store-requests")
@RequiredArgsConstructor
public class VendorStoreRequestNotifyController {

    private final VendorStoreRequestNotifyService notifyService;

    @PostMapping("/notify")
    public ResponseEntity<Void> notifyNewRequest(@Valid @RequestBody VendorStoreRequestNotifyRequest body) {
        notifyService.notifyAdminsOfNewRequest(body);
        return ResponseEntity.accepted().build();
    }
}
