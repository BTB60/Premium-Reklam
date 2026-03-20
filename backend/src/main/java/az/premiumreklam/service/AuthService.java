package az.premiumreklam.service;

import az.premiumreklam.dto.auth.*;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.security.CustomUserDetailsService;
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
    private final CustomUserDetailsService customUserDetailsService;

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

        String token = jwtService.generateToken(
                customUserDetailsService.loadUserByUsername(user.getUsername())
        );

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

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(
                customUserDetailsService.loadUserByUsername(user.getUsername())
        );

        return AuthResponse.fromUser(user, token);
    }
}
