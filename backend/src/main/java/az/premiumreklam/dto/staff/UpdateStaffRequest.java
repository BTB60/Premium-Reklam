package az.premiumreklam.dto.staff;

import az.premiumreklam.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStaffRequest {

    @Size(max = 150)
    private String fullName;

    @Size(max = 50)
    private String username;

    @Email
    @Size(max = 120)
    private String email;

    private String phone;

    /** Boş göndərilməyə bilər; göndəriləndə minimum 6 simvol. */
    @Size(min = 6, max = 100)
    private String password;

    private UserRole role;
}
