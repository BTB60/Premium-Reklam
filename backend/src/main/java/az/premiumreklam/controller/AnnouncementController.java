package az.premiumreklam.controller;

import az.premiumreklam.dto.announcement.AnnouncementRequest;
import az.premiumreklam.dto.announcement.AnnouncementResponse;
import az.premiumreklam.service.AnnouncementReadService;
import az.premiumreklam.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final AnnouncementReadService announcementReadService;

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

    @PostMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Извлекаем UUID из username (предполагаем, что username содержит UUID)
        // Или используем кастомный UserDetails, если есть
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            announcementReadService.markAsRead(userId, id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            // Fallback: ищем пользователя по username в UserService
            return ResponseEntity.badRequest().body("Invalid user ID format");
        }
    }

    @GetMapping("/{id}/read-status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> getReadStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            boolean hasRead = announcementReadService.hasRead(userId, id);
            return ResponseEntity.ok(hasRead);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}