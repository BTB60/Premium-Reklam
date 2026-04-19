package az.premiumreklam;

import az.premiumreklam.config.DatabaseUrlBootstrap;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PremiumReklamApplication {

    public static void main(String[] args) {
        DatabaseUrlBootstrap.applyBeforeSpring();
        SpringApplication.run(PremiumReklamApplication.class, args);
    }
}
