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
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AnnouncementController {

    private final AnnouncementService announcementService;

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