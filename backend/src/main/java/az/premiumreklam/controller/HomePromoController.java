package az.premiumreklam.controller;

import az.premiumreklam.dto.home.HomePromoCampaignRequest;
import az.premiumreklam.service.HomePromoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/home-promo")
@RequiredArgsConstructor
public class HomePromoController {

    private final HomePromoService service;

    @GetMapping
    public List<HomePromoCampaignRequest> active() {
        return service.getAll();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<HomePromoCampaignRequest> admin() {
        return service.getAll();
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<HomePromoCampaignRequest> replace(@RequestBody List<HomePromoCampaignRequest> requests) {
        return service.replaceAll(requests);
    }
}
