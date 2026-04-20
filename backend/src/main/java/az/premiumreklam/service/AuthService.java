package az.premiumreklam.service;

import az.premiumreklam.dto.auth.*;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OtpService otpService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Bu istifadəçi adı artıq mövcuddur");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
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

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        if (isAdmin) {
            if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
                otpService.sendOtp(user.getUsername(), "LOGIN_ADMIN");
                return AuthResponse.otpRequired(user, "OTP kod göndərildi. Daxil etmək üçün yenidən login edin.");
            }
            if (!otpService.verifyOtp(user.getUsername(), "LOGIN_ADMIN", request.getOtpCode())) {
                throw new RuntimeException("OTP kod yanlışdır və ya müddəti bitib");
            }
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());

        return AuthResponse.fromUser(user, token);
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
}
