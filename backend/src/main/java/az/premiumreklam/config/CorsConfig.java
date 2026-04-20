package az.premiumreklam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS is applied via {@link CorsConfigurationSource} + {@code http.cors()} in {@link SecurityConfig}.
 * A standalone {@code CorsFilter} bean is not used: Spring Security must allow OPTIONS preflight
 * ({@code permitAll}) and run the CORS filter in the security chain, otherwise the browser gets
 * no {@code Access-Control-Allow-Origin} on failed preflights.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origin-patterns:https://premium-reklam.vercel.app,http://localhost:3000}")
    private List<String> allowedOriginPatterns;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns);
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}