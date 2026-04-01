package az.premiumreklam.controller;

import az.premiumreklam.dto.auth.*;
import az.premiumreklam.entity.Subadmin;
import az.premiumreklam.service.AuthService;
import az.premiumreklam.service.SubadminService;
import az.premiumreklam.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final SubadminService subadminService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        authService.forgotPassword(email);
        return Map.of("message", "Şifrə sıfırlama linki emailə göndərildi");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        authService.resetPassword(token, newPassword);
        return Map.of("message", "Şifrə uğurla dəyişdirildi");
    }

    // 🔥 ВХОД ДЛЯ SUBADMIN (публичный эндпоинт)
    @PostMapping("/subadmin/login")
    public ResponseEntity<?> subadminLogin(@RequestBody SubadminLoginRequest request) {
        return subadminService.authenticate(request.getLogin(), request.getPassword())
            .map(subadmin -> {
                subadminService.updateLastLogin(subadmin.getId());
                String token = jwtService.generateToken(subadmin.getLogin(), "SUBADMIN", subadmin.getPermissions());
                return ResponseEntity.ok(SubadminLoginResponse.builder()
                    .token(token)
                    .subadminId(subadmin.getId())
                    .login(subadmin.getLogin())
                    .role("SUBADMIN")
                    .permissions(subadmin.getPermissions())
                    .build());
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }

    // 🔥 CRUD ДЛЯ SUBADMIN (только для ADMIN)
    @GetMapping("/subadmins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Subadmin>> getAllSubadmins() {
        return ResponseEntity.ok(subadminService.getAll());
    }

    @PostMapping("/subadmins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Subadmin> createSubadmin(@RequestBody Subadmin subadmin) {
        subadmin.setPermissions(subadminService.defaultPermissions());
        return ResponseEntity.ok(subadminService.create(subadmin));
    }

    @PutMapping("/subadmins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Subadmin> updateSubadmin(@PathVariable String id, @RequestBody Subadmin updated) {
        return ResponseEntity.ok(subadminService.update(id, updated));
    }

    @DeleteMapping("/subadmins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSubadmin(@PathVariable String id) {
        subadminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}