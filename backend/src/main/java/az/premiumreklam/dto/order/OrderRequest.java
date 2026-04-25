package az.premiumreklam.dto.order;

import az.premiumreklam.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class OrderRequest {
    private String customerName;
    private String customerPhone;
    private String customerWhatsapp;
    private String customerAddress;
    private String note;
    private LocalDateTime estimatedReadyAt;
    private String couponCode;
    private PaymentMethod paymentMethod;
    private BigDecimal discountPercent;
    private List<OrderItemRequest> items;
}
