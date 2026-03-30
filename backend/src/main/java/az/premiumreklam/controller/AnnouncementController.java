package az.premiumreklam.controller;

import az.premiumreklam.dto.announcement.AnnouncementRequest;
import az.premiumreklam.entity.Announcement;
import az.premiumreklam.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    // 🔥 GET-методы БЕЗ @PreAuthorize — доступны анонимно
    @GetMapping
    public List<Announcement> getAll() {
        return announcementService.getAll();
    }

    @GetMapping("/active")
    public List<Announcement> getActive() {
        return announcementService.getActive();
    }

    @GetMapping("/{id}")
    public Announcement getById(@PathVariable Long id) {
        return announcementService.getById(id);
    }

    // 🔥 Мутации — только для ADMIN
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Announcement create(@RequestBody AnnouncementRequest request) {
        return announcementService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Announcement update(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Announcement patch(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.ok().build();
    }
}