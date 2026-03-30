package az.premiumreklam.controller;

import az.premiumreklam.dto.announcement.AnnouncementRequest;
import az.premiumreklam.dto.announcement.AnnouncementResponse;
import az.premiumreklam.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public List<AnnouncementResponse> getAll() {
        return announcementService.getAll().stream()
            .map(AnnouncementResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @GetMapping("/active")
    public List<AnnouncementResponse> getActive() {
        return announcementService.getActive().stream()
            .map(AnnouncementResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public AnnouncementResponse getById(@PathVariable Long id) {
        return AnnouncementResponse.fromEntity(announcementService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AnnouncementResponse create(@RequestBody AnnouncementRequest request) {
        return AnnouncementResponse.fromEntity(announcementService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AnnouncementResponse update(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return AnnouncementResponse.fromEntity(announcementService.update(id, request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AnnouncementResponse patch(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return AnnouncementResponse.fromEntity(announcementService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.ok().build();
    }
}