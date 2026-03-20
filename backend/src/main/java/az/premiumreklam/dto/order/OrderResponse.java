package az.premiumreklam.dto.order;

import az.premiumreklam.entity.Order;
import az.premiumreklam.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String customerWhatsapp;
    private String customerAddress;
    private Long userId;
    private String userFullName;
    private String userUsername;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String paymentMethod;
    private Boolean isCredit;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String unit;
        private BigDecimal quantity;
        private BigDecimal width;
        private BigDecimal height;
        private BigDecimal area;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
        private String note;
    }

    public static OrderResponse fromEntity(Order order) {
        OrderResponseBuilder builder = OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .customerWhatsapp(order.getCustomerWhatsapp())
                .customerAddress(order.getCustomerAddress())
                .status(order.getStatus().getValue())
                .subtotal(order.getSubtotal())
                .discountPercent(order.getDiscountPercent())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .remainingAmount(order.getRemainingAmount())
                .paymentMethod(order.getPaymentMethod().name())
                .isCredit(order.getIsCredit())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt());

        if (order.getUser() != null) {
            builder.userId(order.getUser().getId())
                   .userFullName(order.getUser().getFullName())
                   .userUsername(order.getUser().getUsername());
        }

        if (order.getItems() != null) {
            builder.items(order.getItems().stream()
                    .map(item -> OrderItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                            .productName(item.getProductName())
                            .unit(item.getUnit() != null ? item.getUnit().name() : null)
                            .quantity(item.getQuantity())
                            .width(item.getWidth())
                            .height(item.getHeight())
                            .area(item.getArea())
                            .unitPrice(item.getUnitPrice())
                            .lineTotal(item.getLineTotal())
                            .note(item.getNote())
                            .build())
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
