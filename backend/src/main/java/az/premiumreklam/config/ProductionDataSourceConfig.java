package az.premiumreklam.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

/**
 * Render often supplies {@code postgres://} URIs; {@link PostgresDatasourceUrlSupport} normalizes to JDBC.
 */
@Configuration
@Profile({"production", "prod"})
public class ProductionDataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties, Environment env) {
        String raw = PostgresDatasourceUrlSupport.resolveRaw(properties, env);
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException(
                    "Set DATABASE_URL in the host environment (Render: link PostgreSQL) or spring.datasource.url.");
        }
        if (raw.contains("${")) {
            throw new IllegalStateException(
                    "DATABASE_URL is still unresolved (value looks like a placeholder). "
                            + "In Render: Web Service → Environment → add DATABASE_URL from the Postgres resource, then redeploy.");
        }

        String jdbcUrl = PostgresDatasourceUrlSupport.toJdbcUrlForSpring(raw);

        String user = properties.getUsername();
        String pass = properties.getPassword();
        if (user == null || user.isBlank()) {
            user = PostgresDatasourceUrlSupport.extractUsername(raw);
        }
        if (pass == null || pass.isBlank()) {
            pass = PostgresDatasourceUrlSupport.extractPassword(raw);
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
}
