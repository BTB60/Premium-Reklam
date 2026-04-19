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
 * Production {@link DataSource}: reads URL/credentials from env ({@code SPRING_DATASOURCE_*},
 * {@code DATABASE_URL}, {@code PGHOST}/{@code PGDATABASE}/…). Libpq URLs are converted via
 * {@link PostgresDatasourceUrlSupport}.
 */
@Configuration
@Profile({"production", "prod"})
public class ProductionDataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties, Environment env) {
        String raw = PostgresDatasourceUrlSupport.resolveRaw(properties, env);
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException(missingDatabaseMessage());
        }
        if (raw.contains("${")) {
            throw new IllegalStateException(
                    "Datasource URL still looks like an unresolved placeholder (${...}). "
                            + "In Render → Environment, set real values (no ${} in the value field).");
        }

        String jdbcUrl = PostgresDatasourceUrlSupport.toJdbcUrlForSpring(raw);

        String user = PostgresDatasourceUrlSupport.resolveUsername(properties, env, raw);
        String pass = PostgresDatasourceUrlSupport.resolvePassword(properties, env, raw);

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

    private static String missingDatabaseMessage() {
        return String.join("\n",
                "No database URL could be resolved from the environment.",
                "",
                "Set one of the following in Render → Environment (then redeploy):",
                "  • SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/DBNAME  (+ SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD),",
                "  • DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME",
                "  • Or libpq-style: PGHOST, PGDATABASE, PGPORT (optional), PGUSER, PGPASSWORD",
                "",
                "Tip: Link the Render PostgreSQL instance to the web service, or paste the connection string from the DB dashboard.");
    }
}
