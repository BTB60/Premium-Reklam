package az.premiumreklam.dto.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateClientPaymentRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "Məbləğ müsbət olmalıdır")
    private BigDecimal amount;
}
