package az.premiumreklam.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseFixer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void fixDatabase() {
        try {
            log.info(">> Baza temiri baslayir...");

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

            log.info(">> Baza UGURLA yenilendi!");
        } catch (Exception e) {
            log.error(">> Baza temirinde xeta: {}", e.getMessage(), e);
        }
    }
}

