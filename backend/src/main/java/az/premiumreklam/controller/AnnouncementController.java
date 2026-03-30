package az.premiumreklam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AnnouncementController {

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("{\"status\":\"ok\"}");
    }

    @PostMapping
    public ResponseEntity<String> create(@RequestBody(required = false) String body) {
        return ResponseEntity.ok("{\"status\":\"created\"}");
    }

    @GetMapping("/active")
    public ResponseEntity<String> getActive() {
        return ResponseEntity.ok("[]");
    }

    @GetMapping
    public ResponseEntity<String> getAll() {
        return ResponseEntity.ok("[]");
    }

    @GetMapping("/{id}")
    public ResponseEntity<String> getById(@PathVariable Long id) {
        return ResponseEntity.ok("{\"id\":" + id + "}");
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> update(@PathVariable Long id) {
        return ResponseEntity.ok("{\"status\":\"updated\"}");
    }

    @PatchMapping("/{id}")
    public ResponseEntity<String> patch(@PathVariable Long id) {
        return ResponseEntity.ok("{\"status\":\"patched\"}");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        return ResponseEntity.ok("{\"status\":\"deleted\"}");
    }
}