package az.premiumreklam.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Production hotfix for legacy PostgreSQL schemas that were created
 * before the total_debt column existed on users table.
 */
@Slf4j
@Component
@Order(0)
@Profile({"docker", "production", "prod"})
@RequiredArgsConstructor
public class PostgresSchemaHotfixRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS users
                ADD COLUMN IF NOT EXISTS total_debt NUMERIC(12,2) NOT NULL DEFAULT 0
                """);
        jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS users
                ADD COLUMN IF NOT EXISTS order_blocked BOOLEAN NOT NULL DEFAULT FALSE
                """);
        jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS users
                ADD COLUMN IF NOT EXISTS next_weekly_due_date DATE
                """);
        jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS client_payment_requests
                ADD COLUMN IF NOT EXISTS receipt_image_data TEXT
                """);
        jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS client_payment_requests
                ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255)
                """);
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
        log.info("Schema hotfix checked: users.total_debt");
    }
}

