package az.premiumreklam.controller;

import az.premiumreklam.dto.announcement.AnnouncementRequest;
import az.premiumreklam.entity.Announcement;
import az.premiumreklam.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    // GET-методы — публичный доступ (для виджета)
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

    // Мутации — защита на уровне UI (админ-панель)
    // В продакшене: добавить проверку роли внутри метода или вернуть @PreAuthorize + исправить JWT_SECRET на Render
    @PostMapping
    public Announcement create(@RequestBody AnnouncementRequest request) {
        return announcementService.create(request);
    }

    @PutMapping("/{id}")
    public Announcement update(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @PatchMapping("/{id}")
    public Announcement patch(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.ok().build();
    }
}