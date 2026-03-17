package az.premiumreklam.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    private String username;

    private String email;
    private String phone;

    @NotBlank
    private String password;
}
