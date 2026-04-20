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

            log.info(">> Baza UGURLA yenilendi!");
        } catch (Exception e) {
            log.error(">> Baza temirinde xeta: {}", e.getMessage(), e);
        }
    }
}

