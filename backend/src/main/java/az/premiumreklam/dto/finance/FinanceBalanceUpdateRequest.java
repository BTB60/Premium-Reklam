package az.premiumreklam.dto.finance;

import az.premiumreklam.enums.FinanceTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FinanceBalanceUpdateRequest {
    @NotNull
    private Long userId;

    @NotNull
    @DecimalMin(value = "0.01", message = "Məbləğ müsbət olmalıdır")
    private BigDecimal amount;

    @NotNull
    private FinanceTransactionType transactionType;

    private String note;
}

