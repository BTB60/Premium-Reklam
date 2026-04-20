package az.premiumreklam.entity;

import az.premiumreklam.enums.ClientPaymentRequestStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Müştərinin ödəniş bildirişi (gözləmədə); təsdiqlənənə qədər borc dəyişmir.
 */
@Entity
@Table(name = "client_payment_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClientPaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Müştərinin təqdim etdiyi qəbz şəkli (base64 data URL). */
    @Lob
    @Column(name = "receipt_image_data")
    private String receiptImageData;

    @Column(name = "receipt_file_name", length = 255)
    private String receiptFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ClientPaymentRequestStatus status = ClientPaymentRequestStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ClientPaymentRequestStatus.PENDING;
        }
    }
}
