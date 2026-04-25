package az.premiumreklam.controller;

import az.premiumreklam.dto.home.HomeCarouselSlideRequest;
import az.premiumreklam.entity.HomeCarouselSlide;
import az.premiumreklam.service.HomeCarouselService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/home-carousel")
@RequiredArgsConstructor
public class HomeCarouselController {

    private final HomeCarouselService service;

    @GetMapping
    public List<HomeCarouselSlide> active() {
        return service.getActive();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<HomeCarouselSlide> all() {
        return service.getAll();
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<HomeCarouselSlide> replace(@RequestBody List<HomeCarouselSlideRequest> requests) {
        return service.replaceAll(requests);
    }
}
