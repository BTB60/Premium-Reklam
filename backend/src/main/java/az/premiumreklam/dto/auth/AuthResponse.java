package az.premiumreklam.dto.auth;

import az.premiumreklam.entity.User;
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
    private String email;
    private String phone;
    private String role;
    private Boolean requiresOtp;
    private String message;

    public static AuthResponse fromUser(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getValue())
                .requiresOtp(false)
                .build();
    }

    public static AuthResponse otpRequired(User user, String message) {
        return AuthResponse.builder()
                .token(null)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getValue())
                .requiresOtp(true)
                .message(message)
                .build();
    }
}
