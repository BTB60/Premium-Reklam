package az.premiumreklam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AnnouncementController {

    @GetMapping(value = "/ping", produces = "application/json")
    public String ping() {
        return "{\"status\":\"ok\"}";
    }

    @PostMapping(value = "", produces = "application/json", consumes = "application/json")
    public String create(@RequestBody(required = false) String body) {
        return "{\"status\":\"created\",\"received\":" + (body != null ? body : "null") + "}";
    }

    @GetMapping(value = "/active", produces = "application/json")
    public String getActive() {
        return "[]";
    }

    @GetMapping(value = "", produces = "application/json")
    public String getAll() {
        return "[]";
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public String getById(@PathVariable Long id) {
        return "{\"id\":" + id + "}";
    }

    @PutMapping(value = "/{id}", produces = "application/json")
    public String update(@PathVariable Long id) {
        return "{\"status\":\"updated\",\"id\":" + id + "}";
    }

    @PatchMapping(value = "/{id}", produces = "application/json")
    public String patch(@PathVariable Long id) {
        return "{\"status\":\"patched\",\"id\":" + id + "}";
    }

    @DeleteMapping(value = "/{id}", produces = "application/json")
    public String delete(@PathVariable Long id) {
        return "{\"status\":\"deleted\",\"id\":" + id + "}";
    }
}