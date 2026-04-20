package az.premiumreklam.dto.finance;

import az.premiumreklam.enums.FinanceTransactionType;
import az.premiumreklam.entity.TransactionHistory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FinanceTransactionHistoryRow {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private FinanceTransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String performedBy;
    private String note;
    private LocalDateTime createdAt;

    public static FinanceTransactionHistoryRow from(TransactionHistory h) {
        return FinanceTransactionHistoryRow.builder()
                .id(h.getId())
                .userId(h.getUser().getId())
                .username(h.getUser().getUsername())
                .fullName(h.getUser().getFullName())
                .transactionType(h.getTransactionType())
                .amount(h.getAmount())
                .balanceBefore(h.getBalanceBefore())
                .balanceAfter(h.getBalanceAfter())
                .performedBy(h.getPerformedBy())
                .note(h.getNote())
                .createdAt(h.getCreatedAt())
                .build();
    }
}

