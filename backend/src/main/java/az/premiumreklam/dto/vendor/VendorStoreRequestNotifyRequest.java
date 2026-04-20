package az.premiumreklam.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorStoreRequestNotifyRequest {

    /** Müştəri tərəfdəki lokal müraciət ID (dedupe üçün) */
    @NotBlank
    @Size(max = 80)
    private String requestId;

    @NotBlank
    @Size(max = 200)
    private String storeName;
}
