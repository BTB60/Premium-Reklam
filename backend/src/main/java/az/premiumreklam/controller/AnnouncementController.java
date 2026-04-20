package az.premiumreklam.controller;

import az.premiumreklam.dto.announcement.AnnouncementRequest;
import az.premiumreklam.entity.Announcement;
import az.premiumreklam.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
// ❌ УДАЛЕНО: @CrossOrigin(origins = "*", allowedHeaders = "*")
// ✅ Глобальный CorsConfig.java уже обрабатывает CORS для всего приложения
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

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

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public Announcement create(@RequestBody AnnouncementRequest request) {
        return announcementService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public Announcement update(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public Announcement patch(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.ok().build();
    }
}