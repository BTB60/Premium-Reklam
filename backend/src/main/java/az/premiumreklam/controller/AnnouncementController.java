package az.premiumreklam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AnnouncementController {

    // 🔥 ТЕСТОВЫЙ ЭНДПОИНТ — просто возвращает OK
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    // 🔥 POST без сервисов — просто эхо
    @PostMapping
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<Map<String, Object>> create(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "created");
        response.put("received", body != null ? body : "empty");
        response.put("timestamp", new Date().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    public ResponseEntity<List<?>> getActive() {
        return ResponseEntity.ok(new ArrayList<>());
    }

    @GetMapping
    public ResponseEntity<List<?>> getAll() {
        return ResponseEntity.ok(new ArrayList<>());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Long>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> update(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("status", "updated", "id", String.valueOf(id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, String>> patch(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("status", "patched", "id", String.valueOf(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("status", "deleted", "id", String.valueOf(id)));
    }
}