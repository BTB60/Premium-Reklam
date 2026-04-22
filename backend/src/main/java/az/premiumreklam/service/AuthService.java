package az.premiumreklam.service;

import az.premiumreklam.dto.auth.*;
import az.premiumreklam.entity.Subadmin;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.SubadminRepository;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SubadminRepository subadminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getUsername() != null) {
            request.setUsername(request.getUsername().trim());
        }
        if (request.getEmail() != null) {
            request.setEmail(request.getEmail().trim());
        }
        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new RuntimeException("Bu istifadəçi adı artıq mövcuddur");
        }

        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new RuntimeException("Bu email artıq mövcuddur");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.DECORCU)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());

        return AuthResponse.fromUser(user, token);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String password = request.getPassword() != null ? request.getPassword() : "";
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        User user = userRepository.findByUsernameIgnoreCase(username)
                .or(() -> userRepository.findByEmailIgnoreCase(username))
                .orElse(null);
        if (user != null) {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
            String token = jwtService.generateToken(user.getUsername());
            return AuthResponse.fromUser(user, token);
        }

        Subadmin subadmin = subadminRepository.findByLoginIgnoreCase(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));
        subadmin.setLastLogin(LocalDateTime.now());
        subadminRepository.save(subadmin);
        // ElementCollection permissions are LAZY; copy inside transaction for JWT + JSON
        Map<String, String> permCopy = copyPermissionMap(subadmin.getPermissions());
        String subToken = jwtService.generateToken(subadmin.getLogin(), "SUBADMIN", permCopy);
        return AuthResponse.builder()
                .token(subToken)
                .userId(subadmin.getId())
                .username(subadmin.getLogin())
                .fullName(subadmin.getLogin())
                .email(null)
                .phone(null)
                .role("SUBADMIN")
                .permissions(permCopy.isEmpty() ? null : new HashMap<>(permCopy))
                .build();
    }

    private static Map<String, String> copyPermissionMap(Map<String, String> raw) {
        if (raw == null || raw.isEmpty()) {
            return Collections.emptyMap();
        }
        return new HashMap<>(raw);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bu email ilə istifadəçi tapılmadı"));

        // Generate reset token (valid for 1 hour)
        String resetToken = jwtService.generateResetToken(user);
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        // In production, send email here
        // For now, log the token
        System.out.println("Password reset token for " + email + ": " + resetToken);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Keçərsiz token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token müddəti bitib");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    public void changeOwnPassword(String username, String currentPassword, String newPassword) {
        if (username == null || username.isBlank()) {
            throw new RuntimeException("İstifadəçi tapılmadı");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Yeni şifrə ən azı 6 simvol olmalıdır");
        }

        User user = userRepository.findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        String cur = currentPassword != null ? currentPassword : "";
        if (!passwordEncoder.matches(cur, user.getPasswordHash())) {
            throw new RuntimeException("Cari şifrə səhvdir");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
