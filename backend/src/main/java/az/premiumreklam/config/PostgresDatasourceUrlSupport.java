package az.premiumreklam.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Render / Heroku-style {@code DATABASE_URL} is often a libpq URI ({@code postgres://}).
 * JDBC expects {@code jdbc:postgresql://...}. This class centralizes parsing and SSL hints.
 */
public final class PostgresDatasourceUrlSupport {

    private PostgresDatasourceUrlSupport() {
    }

    /** Spring Boot maps SPRING_DATASOURCE_URL → spring.datasource.url; list OS keys we read before YAML. */
    private static final String[] DATABASE_URL_ENV_KEYS = {
            "SPRING_DATASOURCE_URL",
            "DATABASE_URL",
            "NEON_DATABASE_URL",
            "JDBC_DATABASE_URL",
            "POSTGRES_URL",
            "POSTGRESQL_URL",
    };

    /**
     * First non-blank URL from OS env (Render / Neon / Heroku often use different names).
     */
    public static String findRawDatabaseUrlFromOs() {
        for (String key : DATABASE_URL_ENV_KEYS) {
            String v = System.getenv(key);
            if (v != null && !v.isBlank() && !v.contains("${")) {
                return v;
            }
        }
        return null;
    }

    /** Prefer OS env so YAML placeholders never leave a literal {@code ${...}} to Hikari. */
    public static String resolveRaw(DataSourceProperties properties, Environment env) {
        String fromOs = findRawDatabaseUrlFromOs();
        if (fromOs != null) {
            return fromOs;
        }
        for (String key : DATABASE_URL_ENV_KEYS) {
            String v = env.getProperty(key);
            if (v != null && !v.isBlank() && !v.contains("${")) {
                return v;
            }
        }
        String composed = tryComposeJdbcUrlFromDiscretePostgresEnv(env);
        if (composed != null) {
            return composed;
        }
        return properties.getUrl();
    }

    /**
     * Render Postgres (and others) sometimes expose {@code PGHOST}, {@code PGDATABASE}, {@code PGPORT}
     * instead of a single {@code DATABASE_URL}.
     */
    public static String tryComposeJdbcUrlFromDiscretePostgresEnv(Environment env) {
        String host = firstNonBlank(
                System.getenv("PGHOST"),
                env.getProperty("PGHOST"),
                System.getenv("SPRING_DATASOURCE_HOST"),
                env.getProperty("SPRING_DATASOURCE_HOST"));
        String db = firstNonBlank(
                System.getenv("PGDATABASE"),
                System.getenv("POSTGRES_DB"),
                env.getProperty("PGDATABASE"),
                env.getProperty("POSTGRES_DB"),
                System.getenv("SPRING_DATASOURCE_NAME"),
                env.getProperty("SPRING_DATASOURCE_NAME"));
        if (host == null || host.isBlank() || db == null || db.isBlank()) {
            return null;
        }
        String port = firstNonBlank(
                System.getenv("PGPORT"),
                env.getProperty("PGPORT"),
                "5432");
        String base = "jdbc:postgresql://" + host.trim() + ":" + port.trim() + "/" + db.trim();
        return appendSslForManagedCloudIfMissing(base);
    }

    /** Username when not embedded in URL: Spring standard, then libpq env. */
    public static String resolveUsername(DataSourceProperties properties, Environment env, String rawUrl) {
        String u = properties.getUsername();
        if (u != null && !u.isBlank()) {
            return u;
        }
        u = extractUsername(rawUrl);
        if (u != null && !u.isBlank()) {
            return u;
        }
        return firstNonBlank(
                System.getenv("SPRING_DATASOURCE_USERNAME"),
                env.getProperty("SPRING_DATASOURCE_USERNAME"),
                System.getenv("PGUSER"),
                env.getProperty("PGUSER"));
    }

    /** Password when not embedded in URL. */
    public static String resolvePassword(DataSourceProperties properties, Environment env, String rawUrl) {
        String p = properties.getPassword();
        if (p != null && !p.isBlank()) {
            return p;
        }
        p = extractPassword(rawUrl);
        if (p != null && !p.isBlank()) {
            return p;
        }
        return firstNonBlank(
                System.getenv("SPRING_DATASOURCE_PASSWORD"),
                env.getProperty("SPRING_DATASOURCE_PASSWORD"),
                System.getenv("PGPASSWORD"),
                env.getProperty("PGPASSWORD"));
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    /**
     * Converts libpq or jdbc URL into a JDBC URL suitable for {@code spring.datasource.url}.
     */
    public static String toJdbcUrlForSpring(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        String jdbc;
        if (raw.startsWith("jdbc:")) {
            jdbc = appendSslForManagedCloudIfMissing(raw);
        } else {
            jdbc = libpqUriToJdbcUrl(raw);
        }
        return normalizePgJdbcQueryParams(jdbc);
    }

    public static String extractUsername(String raw) {
        if (raw == null || raw.startsWith("jdbc:")) {
            return null;
        }
        String userInfo = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://")).getUserInfo();
        if (userInfo == null || userInfo.isBlank()) {
            return null;
        }
        String[] up = userInfo.split(":", 2);
        return URLDecoder.decode(up[0], StandardCharsets.UTF_8);
    }

    public static String extractPassword(String raw) {
        if (raw == null || raw.startsWith("jdbc:")) {
            return null;
        }
        String userInfo = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://")).getUserInfo();
        if (userInfo == null || !userInfo.contains(":")) {
            return null;
        }
        String[] up = userInfo.split(":", 2);
        if (up.length < 2) {
            return null;
        }
        return URLDecoder.decode(up[1], StandardCharsets.UTF_8);
    }

    private static String libpqUriToJdbcUrl(String raw) {
        URI httpStyle = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://"));
        String host = httpStyle.getHost();
        if (host == null) {
            throw new IllegalArgumentException("Invalid DATABASE_URL (missing host): " + mask(raw));
        }
        int port = httpStyle.getPort() != -1 ? httpStyle.getPort() : 5432;
        String path = httpStyle.getPath();
        if (path != null && path.startsWith("/")) {
            path = path.substring(1);
        }
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Invalid DATABASE_URL (missing database name): " + mask(raw));
        }

        StringBuilder jdbc = new StringBuilder();
        jdbc.append("jdbc:postgresql://").append(host).append(":").append(port).append("/").append(path);
        if (httpStyle.getQuery() != null && !httpStyle.getQuery().isBlank()) {
            jdbc.append("?").append(httpStyle.getQuery());
        }
        return appendSslForManagedCloudIfMissing(jdbc.toString());
    }

    /**
     * Neon / AWS RDS often need TLS; libpq URLs may already include {@code sslmode=require}.
     */
    private static String appendSslForManagedCloudIfMissing(String jdbcUrl) {
        if (jdbcUrl.contains("sslmode=")) {
            return jdbcUrl;
        }
        boolean needsSsl = jdbcUrl.contains(".render.com")
                || jdbcUrl.contains(".neon.tech")
                || jdbcUrl.contains(".amazonaws.com");
        if (!needsSsl) {
            return jdbcUrl;
        }
        return jdbcUrl + (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
    }

    /**
     * pgjdbc expects {@code channelBinding}, while Neon copies often use libpq's {@code channel_binding}.
     */
    private static String normalizePgJdbcQueryParams(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.contains("channel_binding=")) {
            return jdbcUrl;
        }
        return jdbcUrl.replace("channel_binding=", "channelBinding=");
    }

    private static String mask(String url) {
        if (url == null) {
            return "";
        }
        return url.replaceAll("://([^:@/]+):([^@/]+)@", "://***:***@");
    }
}
