package az.premiumreklam.dto.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateClientPaymentRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "Məbləğ müsbət olmalıdır")
    private BigDecimal amount;

    @Size(max = 5_000_000, message = "Qəbz şəkli çox böyükdür")
    private String receiptImageData;

    @Size(max = 255, message = "Fayl adı çox uzundur")
    private String receiptFileName;
}
