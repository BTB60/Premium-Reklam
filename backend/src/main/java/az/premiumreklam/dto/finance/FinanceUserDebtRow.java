package az.premiumreklam.dto.finance;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FinanceUserDebtRow {
    private Long userId;
    private String username;
    private String fullName;
    private BigDecimal totalDebt;
}

