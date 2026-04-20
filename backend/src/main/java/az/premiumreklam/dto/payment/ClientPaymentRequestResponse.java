package az.premiumreklam.dto.payment;

import az.premiumreklam.entity.ClientPaymentRequest;
import az.premiumreklam.enums.ClientPaymentRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ClientPaymentRequestResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String username;
    private BigDecimal amount;
    private ClientPaymentRequestStatus status;
    private LocalDateTime createdAt;

    public static ClientPaymentRequestResponse from(ClientPaymentRequest e) {
        return ClientPaymentRequestResponse.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .userFullName(e.getUser().getFullName())
                .username(e.getUser().getUsername())
                .amount(e.getAmount())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
