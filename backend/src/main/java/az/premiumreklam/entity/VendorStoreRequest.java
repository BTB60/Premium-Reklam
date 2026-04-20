package az.premiumreklam.entity;

import az.premiumreklam.enums.VendorStoreRequestStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_store_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VendorStoreRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Müştəri tərəfdəki köhnə lokal id (isteğe bağlı, dedupe üçün) */
    @Column(name = "client_reference_id", length = 80)
    private String clientReferenceId;

    @Column(name = "store_name", nullable = false, length = 200)
    private String storeName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(nullable = false, length = 40)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(name = "vendor_display_name", nullable = false, length = 150)
    private String vendorDisplayName;

    @Column(name = "vendor_phone", length = 30)
    private String vendorPhone;

    @Column(name = "categories_json", nullable = false, columnDefinition = "TEXT")
    private String categoriesJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VendorStoreRequestStatus status;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "processed_by", length = 80)
    private String processedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = VendorStoreRequestStatus.PENDING;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
