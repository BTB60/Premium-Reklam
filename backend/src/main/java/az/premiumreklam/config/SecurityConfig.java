package az.premiumreklam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Этот лог ДОЛЖЕН появиться в Render при старте
        System.out.println(">>> [SecurityConfig] >>> PERMIT_ALL_CHAIN_APPLIED <<<");
        
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .anonymous(anonymous -> anonymous.disable())
            .sessionManagement(sm -> sm.disable());
            
        return http.build();
    }
}