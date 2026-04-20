package az.premiumreklam.controller;

import az.premiumreklam.dto.order.OrderResponse;
import az.premiumreklam.entity.Order;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.repository.OrderRepository;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // İstifadəçi statistikası
        List<User> users = userRepository.findAll();
        long totalUsers = users.size();
        long adminCount = users.stream().filter(u -> u.getRole() == UserRole.ADMIN).count();
        long kassirCount = users.stream().filter(u -> u.getRole() == UserRole.KASSIR).count();
        long muhasibCount = users.stream().filter(u -> u.getRole() == UserRole.MUHASIB).count();
        long decorcuCount = users.stream()
                .filter(u -> u.getRole() == UserRole.DECORCU || u.getRole() == UserRole.DECORATOR)
                .count();

        stats.put("totalUsers", totalUsers);
        stats.put("adminCount", adminCount);
        stats.put("kassirCount", kassirCount);
        stats.put("muhasibCount", muhasibCount);
        stats.put("decorcuCount", decorcuCount);

        // Sifariş statistikası
        List<Order> orders = orderRepository.findAll();
        int totalOrders = orders.size();
        long pendingOrders = orders.stream()
                .filter(o -> o.getStatus() != null)
                .filter(o -> "PENDING".equalsIgnoreCase(String.valueOf(o.getStatus())))
                .count();
        BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = orders.stream()
                .map(Order::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRemaining = orders.stream()
                .map(Order::getRemainingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalPaid", totalPaid);
        stats.put("totalRemaining", totalRemaining);

        // Aylıq statistika
        LocalDateTime startOfMonth = LocalDateTime.now().with(TemporalAdjusters.firstDayOfMonth()).withHour(0).withMinute(0);
        List<Order> monthlyOrders = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfMonth))
                .toList();

        BigDecimal monthlyRevenue = monthlyOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.put("monthlyOrders", monthlyOrders.size());
        stats.put("monthlyRevenue", monthlyRevenue);

        return stats;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/orders")
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders().stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
