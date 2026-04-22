package az.premiumreklam.service;

import az.premiumreklam.dto.order.OrderItemRequest;
import az.premiumreklam.dto.order.OrderRequest;
import az.premiumreklam.dto.realtime.RealtimeEventDto;
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
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UserPriceRepository userPriceRepository;
    private final PromoCouponService promoCouponService;
    private final RealtimePushService realtimePushService;

    @Transactional
    public Order createOrder(OrderRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        enforceOrderEligibility(user);

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
                    var userPriceOpt = userPriceRepository.findByUser_IdAndProduct_IdAndIsActiveTrue(user.getId(), product.getId());
                    if (userPriceOpt.isPresent()) {
                        unitPrice = userPriceOpt.get().getCustomPrice();
                    } else {
                        unitPrice = product.getSalePrice() != null
                                ? product.getSalePrice()
                                : defaultBigDecimal(itemRequest.getUnitPrice());
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
        BigDecimal couponDiscount = promoCouponService.calculateAndConsumeDiscount(request.getCouponCode(), subtotal);
        discountAmount = discountAmount.add(couponDiscount);
        if (discountAmount.compareTo(subtotal) > 0) {
            discountAmount = subtotal;
        }
        BigDecimal total = subtotal.subtract(discountAmount);

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(total);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setRemainingAmount(total);
        order.setIsCredit(total.compareTo(BigDecimal.ZERO) > 0);

        Order saved = orderRepository.save(order);

        // Yeni sifarişin ödənilməmiş hissəsi istifadəçinin ümumi borcuna əlavə olunur.
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentDebt = user.getTotalDebt() == null ? BigDecimal.ZERO : user.getTotalDebt();
            user.setTotalDebt(currentDebt.add(total));
            if (user.getNextWeeklyDueDate() == null) {
                user.setNextWeeklyDueDate(LocalDate.now().plusDays(7));
            }
            userRepository.save(user);
        }

        // Yenidən yüklə ki, items (+ item.product) sessiya içində tam init olsun; JSON/DTO xəta verməsin
        Order full = orderRepository.findWithDetailsById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Sifariş saxlanılmadı"));

        realtimePushService.notifyAdmins(RealtimeEventDto.builder()
                .event("NEW_ORDER")
                .message(user.getFullName() + " — yeni sifariş: " + full.getOrderNumber()
                        + " (" + total + " AZN)")
                .soundProfile("admin")
                .dedupeKey("order-new-" + full.getId())
                .build());

        return full;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));
        return orderRepository.findByUser_Id(user.getId());
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
    }

    @Transactional
    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
        order.setStatus(status);
        orderRepository.save(order);
        Order updated = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
        User owner = updated.getUser();
        if (owner != null) {
            realtimePushService.notifyUser(owner.getUsername(), RealtimeEventDto.builder()
                    .event("ORDER_STATUS")
                    .message("Sifariş " + updated.getOrderNumber() + " — yeni status: " + status)
                    .soundProfile("user")
                    .dedupeKey("order-status-" + id + "-" + status)
                    .build());
        }
        return updated;
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }

    private String generateOrderNumber() {
        int suffix = ThreadLocalRandom.current().nextInt(0x1000000);
        return "ORD-" + LocalDate.now().toString().replace("-", "") + "-" +
                String.format("%06X", suffix);
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal defaultBigDecimal(BigDecimal value, BigDecimal defaultValue) {
        return value == null ? defaultValue : value;
    }

    private void enforceOrderEligibility(User user) {
        BigDecimal totalDebt = user.getTotalDebt() == null ? BigDecimal.ZERO : user.getTotalDebt();
        LocalDate dueDate = user.getNextWeeklyDueDate();
        boolean manuallyBlocked = Boolean.TRUE.equals(user.getOrderBlocked());

        if (manuallyBlocked) {
            throw new RuntimeException("Sifariş müvəqqəti bloklanıb. Yalnız admin blokdan çıxara bilər.");
        }

        if (totalDebt.compareTo(BigDecimal.ZERO) > 0 && dueDate != null && dueDate.isBefore(LocalDate.now())) {
            user.setOrderBlocked(true);
            userRepository.save(user);
            throw new RuntimeException("Həftəlik ödəniş gecikib. Yeni sifariş üçün admin blokunu açmalıdır.");
        }
    }
}
