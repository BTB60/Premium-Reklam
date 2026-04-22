package az.premiumreklam.config;

import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(10)
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Defensive schema guard: ensure legacy DBs have the new column before JPA queries.
        ensureTotalDebtColumn();

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

        User decorator = userRepository.findByUsername("dekorator").orElse(null);
        if (decorator == null) {
            decorator = User.builder()
                    .username("dekorator")
                    .fullName("Test Dekorator")
                    .phone("0501112233")
                    .email("dekorator@premiumreklam.az")
                    .role(UserRole.DECORCU)
                    .status(UserStatus.ACTIVE)
                    .monthlyTarget(BigDecimal.valueOf(500))
                    .monthlySalesTotal(BigDecimal.ZERO)
                    .discountPercent(BigDecimal.ZERO)
                    .build();
        }
        decorator.setPasswordHash(passwordEncoder.encode("dekor123"));
        userRepository.save(decorator);
        System.out.println("✅ Test decorator ready: dekorator / dekor123");
    }

    private void ensureTotalDebtColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS total_debt NUMERIC(19,2) DEFAULT 0");
            jdbcTemplate.execute("UPDATE users SET total_debt = 0 WHERE total_debt IS NULL");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN total_debt SET NOT NULL");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS order_blocked BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("UPDATE users SET order_blocked = FALSE WHERE order_blocked IS NULL");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN order_blocked SET NOT NULL");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS next_weekly_due_date DATE");
            jdbcTemplate.execute("ALTER TABLE client_payment_requests ADD COLUMN IF NOT EXISTS receipt_image_data TEXT");
            jdbcTemplate.execute("ALTER TABLE client_payment_requests ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255)");
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS promo_coupons (
                        id BIGSERIAL PRIMARY KEY,
                        code VARCHAR(64) UNIQUE NOT NULL,
                        discount_percent NUMERIC(5,2) NOT NULL,
                        min_order_amount NUMERIC(12,2),
                        max_uses INTEGER,
                        used_count INTEGER NOT NULL DEFAULT 0,
                        active BOOLEAN NOT NULL DEFAULT TRUE,
                        expires_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )
                    """);
        } catch (Exception e) {
            // Keep startup resilient; if this fails, Hibernate/DB logs will show exact cause.
            System.err.println("DataLoader schema guard warning: " + e.getMessage());
        }
    }
}
