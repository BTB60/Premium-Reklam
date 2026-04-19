package az.premiumreklam.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubadminLoginResponse {
    private String token;
    private Long subadminId;
    private String login;
    private String role;
    private Map<String, String> permissions;
}
