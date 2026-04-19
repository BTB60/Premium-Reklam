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

    /** Prefer OS env so YAML placeholders never leave a literal {@code ${...}} to Hikari. */
    public static String resolveRaw(DataSourceProperties properties, Environment env) {
        String fromEnv = System.getenv("DATABASE_URL");
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        String fromSpringEnv = env.getProperty("DATABASE_URL");
        if (fromSpringEnv != null && !fromSpringEnv.isBlank()) {
            return fromSpringEnv;
        }
        return properties.getUrl();
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
