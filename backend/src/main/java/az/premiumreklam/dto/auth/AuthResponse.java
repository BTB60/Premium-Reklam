package az.premiumreklam.dto.auth;

import az.premiumreklam.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private UUID userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;

    public static AuthResponse fromUser(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getValue())
                .build();
    }
}
