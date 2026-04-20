package az.premiumreklam.dto.vendor;

import az.premiumreklam.entity.User;
import az.premiumreklam.entity.VendorStoreRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorStoreRequestResponse {

    private Long id;
    private Long userId;
    private String username;
    private String userFullName;
    private String clientReferenceId;
    private String storeName;
    private String description;
    private String address;
    private String phone;
    private String email;
    private String vendorDisplayName;
    private String vendorPhone;
    private List<String> categories;
    private String status;
    private String rejectionReason;
    private String processedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime processedAt;

    public static VendorStoreRequestResponse from(VendorStoreRequest e, ObjectMapper objectMapper) {
        List<String> cats = Collections.emptyList();
        try {
            cats = objectMapper.readValue(e.getCategoriesJson(), new TypeReference<>() {});
        } catch (Exception ignored) {
        }
        User u = e.getUser();
        return VendorStoreRequestResponse.builder()
                .id(e.getId())
                .userId(u != null ? u.getId() : null)
                .username(u != null ? u.getUsername() : null)
                .userFullName(u != null ? u.getFullName() : null)
                .clientReferenceId(e.getClientReferenceId())
                .storeName(e.getStoreName())
                .description(e.getDescription())
                .address(e.getAddress())
                .phone(e.getPhone())
                .email(e.getEmail())
                .vendorDisplayName(e.getVendorDisplayName())
                .vendorPhone(e.getVendorPhone())
                .categories(cats)
                .status(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null)
                .rejectionReason(e.getRejectionReason())
                .processedBy(e.getProcessedBy())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .processedAt(e.getProcessedAt())
                .build();
    }
}
