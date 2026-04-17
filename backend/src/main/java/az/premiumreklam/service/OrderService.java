package az.premiumreklam.service;

import az.premiumreklam.dto.order.OrderItemRequest;
import az.premiumreklam.dto.order.OrderRequest;
import az.premiumreklam.entity.*;
import az.premiumreklam.enums.OrderStatus;
import az.premiumreklam.enums.ProductUnit;
import az.premiumreklam.repository.OrderRepository;
import az.premiumreklam.repository.ProductRepository;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.repository.UserPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UserPriceRepository userPriceRepository;

    @Transactional
    public Order createOrder(OrderRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerWhatsapp(request.getCustomerWhatsapp())
                .customerAddress(request.getCustomerAddress())
                .note(request.getNote())
                .paymentMethod(request.getPaymentMethod())
                .discountPercent(defaultBigDecimal(request.getDiscountPercent()))
                .status(OrderStatus.PENDING)
                .user(user)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (OrderItemRequest itemRequest : request.getItems()) {
                Product product = null;
                if (itemRequest.getProductId() != null) {
                    product = productRepository.findById(itemRequest.getProductId())
                            .orElse(null);
                }

                BigDecimal quantity = defaultBigDecimal(itemRequest.getQuantity(), BigDecimal.ONE);
                BigDecimal unitPrice = BigDecimal.ZERO;
                if (product != null) {
                    var userPriceOpt = userPriceRepository.findByUserIdAndProductIdAndIsActiveTrue(user.getId(), product.getId());
                    if (userPriceOpt.isPresent()) {
                        unitPrice = userPriceOpt.get().getCustomPrice();
                    } else {
                        unitPrice = product.getSalePrice() != null ? product.getSalePrice() : defaultBigDecimal(itemRequest.getUnitPrice());
                    }
                } else {
                    unitPrice = defaultBigDecimal(itemRequest.getUnitPrice());
                }
                BigDecimal width = itemRequest.getWidth();
                BigDecimal height = itemRequest.getHeight();
                ProductUnit unit = (product != null && product.getUnit() != null) 
                        ? product.getUnit() 
                        : (itemRequest.getUnit() == null ? ProductUnit.M2 : itemRequest.getUnit());

                BigDecimal area = BigDecimal.ZERO;
                BigDecimal lineTotal;

                if (unit == ProductUnit.M2) {
                    BigDecimal safeWidth = defaultBigDecimal(width);
                    BigDecimal safeHeight = defaultBigDecimal(height);
                    area = safeWidth.multiply(safeHeight);
                    lineTotal = area.multiply(unitPrice).multiply(quantity);
                } else {
                    lineTotal = quantity.multiply(unitPrice);
                }

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .productName(product != null ? product.getName() : itemRequest.getProductName())
                        .unit(unit)
                        .quantity(quantity)
                        .width(width)
                        .height(height)
                        .area(area)
                        .unitPrice(unitPrice)
                        .lineTotal(lineTotal)
                        .note(itemRequest.getNote())
                        .build();

                order.addItem(orderItem);
                subtotal = subtotal.add(lineTotal);

                if (product != null && product.getStockQuantity() != null) {
                    product.setStockQuantity(product.getStockQuantity().subtract(quantity));
                    productRepository.save(product);
                }
            }
        }

        BigDecimal discountPercent = defaultBigDecimal(order.getDiscountPercent());
        BigDecimal discountAmount = subtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100));
        BigDecimal total = subtotal.subtract(discountAmount);

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(total);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setRemainingAmount(total);
        order.setIsCredit(total.compareTo(BigDecimal.ZERO) > 0);

        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));
        return orderRepository.findByUserId(user.getId());
    }

    public Order getOrderById(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
    }

    @Transactional
    public Order updateOrderStatus(UUID id, OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Transactional
    public void deleteOrder(UUID id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }

    private String generateOrderNumber() {
        return "ORD-" + LocalDate.now().toString().replace("-", "") + "-" +
                UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal defaultBigDecimal(BigDecimal value, BigDecimal defaultValue) {
        return value == null ? defaultValue : value;
    }
}