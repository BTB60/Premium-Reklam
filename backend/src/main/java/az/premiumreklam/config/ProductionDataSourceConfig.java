package az.premiumreklam.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Render and similar platforms often set {@code DATABASE_URL} as a libpq URI
 * ({@code postgres://} / {@code postgresql://}). JDBC requires {@code jdbc:postgresql://...}.
 */
@Configuration
@Profile({"production", "prod"})
public class ProductionDataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties, Environment env) {
        String raw = resolveDatabaseUrl(properties, env);
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException(
                    "Set DATABASE_URL in the host environment (Render: link PostgreSQL) or spring.datasource.url.");
        }
        if (raw.contains("${")) {
            throw new IllegalStateException(
                    "DATABASE_URL is still unresolved (value looks like a placeholder). "
                            + "In Render: Web Service → Environment → add DATABASE_URL from the Postgres resource, then redeploy.");
        }

        String jdbcUrl = raw.startsWith("jdbc:") ? appendSslForManagedCloudIfMissing(raw) : libpqUriToJdbcUrl(raw);

        String user = properties.getUsername();
        String pass = properties.getPassword();
        if (user == null || user.isBlank()) {
            user = extractUserFromLibpq(raw);
        }
        if (pass == null || pass.isBlank()) {
            pass = extractPasswordFromLibpq(raw);
        }

        String origUrl = properties.getUrl();
        String origUser = properties.getUsername();
        String origPass = properties.getPassword();
        properties.setUrl(jdbcUrl);
        if (user != null && !user.isBlank()) {
            properties.setUsername(user);
        }
        if (pass != null && !pass.isBlank()) {
            properties.setPassword(pass);
        }
        try {
            return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
        } finally {
            properties.setUrl(origUrl);
            properties.setUsername(origUser);
            properties.setPassword(origPass);
        }
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
     * Prefer OS env — avoids cases where YAML placeholder never resolves to Hikari.
     */
    private static String resolveDatabaseUrl(DataSourceProperties properties, Environment env) {
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

    private static String appendSslForManagedCloudIfMissing(String jdbcUrl) {
        if (jdbcUrl.contains("sslmode=")) {
            return jdbcUrl;
        }
        if (!jdbcUrl.contains(".render.com")) {
            return jdbcUrl;
        }
        return jdbcUrl + (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
    }

    private static String extractUserFromLibpq(String raw) {
        if (raw.startsWith("jdbc:")) {
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

    private static String extractPasswordFromLibpq(String raw) {
        if (raw.startsWith("jdbc:")) {
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

    private static String mask(String url) {
        if (url == null) {
            return "";
        }
        return url.replaceAll("://([^:@/]+):([^@/]+)@", "://***:***@");
    }
}
