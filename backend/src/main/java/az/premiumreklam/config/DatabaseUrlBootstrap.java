package az.premiumreklam.config;

/**
 * Runs before {@link org.springframework.boot.SpringApplication} so {@code DATABASE_URL}
 * from Render is turned into a JDBC URL (and optional user/password) as JVM system properties.
 * This is the earliest hook without duplicating logic elsewhere ({@link PostgresDatasourceUrlSupport}).
 */
public final class DatabaseUrlBootstrap {

    private DatabaseUrlBootstrap() {
    }

    public static void applyBeforeSpring() {
        String spa = System.getenv("SPRING_PROFILES_ACTIVE");
        if (spa != null && "local".equalsIgnoreCase(spa.trim())) {
            return;
        }
        String raw = PostgresDatasourceUrlSupport.findRawDatabaseUrlFromOs();
        if (raw == null || raw.isBlank()) {
            return;
        }
        String jdbcUrl = PostgresDatasourceUrlSupport.toJdbcUrlForSpring(raw);
        System.setProperty("spring.datasource.url", jdbcUrl);
        String u = PostgresDatasourceUrlSupport.extractUsername(raw);
        String p = PostgresDatasourceUrlSupport.extractPassword(raw);
        if (u != null && !u.isBlank()) {
            System.setProperty("spring.datasource.username", u);
        }
        if (p != null && !p.isBlank()) {
            System.setProperty("spring.datasource.password", p);
        }
    }
}
