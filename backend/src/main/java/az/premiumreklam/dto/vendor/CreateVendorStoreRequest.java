package az.premiumreklam.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVendorStoreRequest {

    @Size(max = 80)
    private String clientReferenceId;

    @NotBlank
    @Size(max = 200)
    private String storeName;

    @NotBlank
    @Size(max = 10000)
    private String description;

    @NotBlank
    @Size(max = 500)
    private String address;

    @NotBlank
    @Size(max = 40)
    private String phone;

    @Size(max = 120)
    private String email;

    @NotBlank
    @Size(max = 150)
    private String vendorDisplayName;

    @Size(max = 30)
    private String vendorPhone;

    @NotEmpty
    private List<@NotBlank @Size(max = 80) String> categories;
}
