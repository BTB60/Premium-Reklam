package az.premiumreklam.dto.vendor;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectVendorStoreRequestBody {

    @Size(max = 2000)
    private String reason;
}
