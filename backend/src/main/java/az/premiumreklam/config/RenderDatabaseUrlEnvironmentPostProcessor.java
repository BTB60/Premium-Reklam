package az.premiumreklam.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * When the OS provides {@code DATABASE_URL} (Render, Heroku-style), force
 * {@code spring.datasource.url} to that value at highest precedence. This avoids
 * a literal {@code ${DATABASE_URL}} reaching Hikari when YAML placeholders do not
 * resolve as expected.
 */
public class RenderDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String envUrl = System.getenv("DATABASE_URL");
        if (envUrl == null || envUrl.isBlank()) {
            return;
        }
        String spa = System.getenv("SPRING_PROFILES_ACTIVE");
        if (spa != null && "local".equalsIgnoreCase(spa.trim())) {
            return;
        }
        String jdbcUrl = PostgresDatasourceUrlSupport.toJdbcUrlForSpring(envUrl);
        Map<String, Object> map = new HashMap<>();
        map.put("spring.datasource.url", jdbcUrl);
        String u = PostgresDatasourceUrlSupport.extractUsername(envUrl);
        String p = PostgresDatasourceUrlSupport.extractPassword(envUrl);
        if (u != null && !u.isBlank()) {
            map.put("spring.datasource.username", u);
        }
        if (p != null && !p.isBlank()) {
            map.put("spring.datasource.password", p);
        }
        environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseUrlFromEnv", map));
    }
}
