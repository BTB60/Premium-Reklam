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
        log.info("Schema hotfix checked: users.total_debt");
    }
}

