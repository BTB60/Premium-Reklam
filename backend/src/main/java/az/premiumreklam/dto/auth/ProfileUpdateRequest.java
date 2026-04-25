package az.premiumreklam.dto.auth;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String email;
    private String profileImage;
}
