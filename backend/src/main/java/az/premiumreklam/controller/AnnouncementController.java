package az.premiumreklam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    // 🔥 Тестовый эндпоинт — если этот работает, значит контроллер регистрируется
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        return ResponseEntity.ok(Map.of("status", "ok", "controller", "registered"));
    }

    // 🔥 Заглушка для /active — возвращает пустой список, но без ошибок
    @GetMapping("/active")
    public ResponseEntity<List<?>> getActive() {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping
    public ResponseEntity<List<?>> getAll() {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Long>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> create(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("status", "created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> update(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("status", "updated", "id", String.valueOf(id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, String>> patch(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("status", "patched", "id", String.valueOf(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("status", "deleted", "id", String.valueOf(id)));
    }
}