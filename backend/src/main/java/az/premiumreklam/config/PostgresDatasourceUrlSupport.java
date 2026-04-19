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
        if (raw.startsWith("jdbc:")) {
            return appendSslForRenderIfMissing(raw);
        }
        return libpqUriToJdbcUrl(raw);
    }

    public static String extractUsername(String raw) {
        if (raw == null || raw.startsWith("jdbc:")) {
            return null;
        }
        String userInfo = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://")).getUserInfo();
        if (userInfo == null || userInfo.isBlank()) {
            return null;
        }
        int colon = userInfo.indexOf(':');
        String user = colon >= 0 ? userInfo.substring(0, colon) : userInfo;
        return URLDecoder.decode(user, StandardCharsets.UTF_8);
    }

    public static String extractPassword(String raw) {
        if (raw == null || raw.startsWith("jdbc:")) {
            return null;
        }
        String userInfo = URI.create(raw.replaceFirst("^postgres(ql)?://", "http://")).getUserInfo();
        if (userInfo == null || !userInfo.contains(":")) {
            return null;
        }
        int colon = userInfo.indexOf(':');
        String pass = userInfo.substring(colon + 1);
        return URLDecoder.decode(pass, StandardCharsets.UTF_8);
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
        return appendSslForRenderIfMissing(jdbc.toString());
    }

    private static String appendSslForRenderIfMissing(String jdbcUrl) {
        if (jdbcUrl.contains("sslmode=")) {
            return jdbcUrl;
        }
        if (!jdbcUrl.contains(".render.com")) {
            return jdbcUrl;
        }
        return jdbcUrl + (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
    }

    private static String mask(String url) {
        if (url == null) {
            return "";
        }
        return url.replaceAll("://([^:@/]+):([^@/]+)@", "://***:***@");
    }
}
