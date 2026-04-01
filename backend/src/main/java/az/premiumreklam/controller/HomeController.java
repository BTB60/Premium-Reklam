package az.premiumreklam.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Premium Reklam Backend işləyir!";
    }

    @GetMapping("/api/public/test")
    public String test() {
        return "Public endpoint işləyir";
    }
}
