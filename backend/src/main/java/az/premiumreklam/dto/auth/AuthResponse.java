package az.premiumreklam.dto.auth;

import az.premiumreklam.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String fullName;
    private UserRole role;
}
