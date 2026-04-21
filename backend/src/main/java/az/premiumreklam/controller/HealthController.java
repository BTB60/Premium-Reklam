package az.premiumreklam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        try (Connection ignored = dataSource.getConnection()) {
            return ResponseEntity.ok(Map.of("status", "UP", "service", "premium-reklam-api", "db", "UP"));
        } catch (Exception ex) {
            return ResponseEntity.status(503)
                    .body(Map.of("status", "DEGRADED", "service", "premium-reklam-api", "db", "DOWN"));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
