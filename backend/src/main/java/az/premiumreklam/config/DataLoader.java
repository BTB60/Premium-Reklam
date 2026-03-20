package az.premiumreklam.config;

import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create or update admin user
        User admin = userRepository.findByUsername("admin").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .username("admin")
                    .fullName("Administrator")
                    .phone("0500000000")
                    .email("admin@premiumreklam.az")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .monthlyTarget(BigDecimal.valueOf(500))
                    .monthlySalesTotal(BigDecimal.ZERO)
                    .discountPercent(BigDecimal.ZERO)
                    .build();
        }
        // Always update password to ensure it's correct
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        userRepository.save(admin);
        System.out.println("✅ Admin user ready: admin / admin123");
    }
}
