package az.premiumreklam;

import az.premiumreklam.config.DatabaseUrlBootstrap;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationListener;

@SpringBootApplication
public class PremiumReklamApplication {

    public static void main(String[] args) {
        DatabaseUrlBootstrap.applyBeforeSpring();
        SpringApplication app = new SpringApplication(PremiumReklamApplication.class);
        app.addListeners((ApplicationListener<ApplicationFailedEvent>) event -> {
            Throwable ex = event.getException();
            System.err.println("========== APPLICATION FAILED — cause chain (read innermost) ==========");
            Throwable t = ex;
            int depth = 0;
            while (t != null && depth < 40) {
                System.err.println("[" + depth + "] " + t.getClass().getName() + ": " + t.getMessage());
                if (t.getCause() == t) {
                    break;
                }
                t = t.getCause();
                depth++;
            }
            System.err.println("==========================================================================");
        });
        app.run(args);
    }
}
