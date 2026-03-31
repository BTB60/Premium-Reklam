package az.premiumreklam;

import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@SpringBootApplication // Убрано exclude = SecurityAutoConfiguration.class
@RequiredArgsConstructor
public class PremiumReklamApplication {

    public static void main(String[] args) {
        SpringApplication.run(PremiumReklamApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = User.builder()
                        .fullName("Admin")
                        .username("admin")
                        .email("admin@premiumreklam.az")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role(UserRole.ADMIN)
                        .status(UserStatus.ACTIVE)
                        .monthlyTarget(BigDecimal.valueOf(500))
                        .monthlySalesTotal(BigDecimal.ZERO)
                        .discountPercent(BigDecimal.ZERO)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                userRepository.save(admin);
                System.out.println(">>> Admin user created: admin / admin123");
            }
        };
    }
}