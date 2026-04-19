package az.premiumreklam.controller;

import az.premiumreklam.dto.order.OrderRequest;
import az.premiumreklam.dto.order.OrderResponse;
import az.premiumreklam.entity.Order;
import az.premiumreklam.enums.OrderStatus;
import az.premiumreklam.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public OrderResponse create(@RequestBody OrderRequest request, Authentication authentication) {
        Order order = orderService.createOrder(request, authentication.getName());
        return OrderResponse.fromEntity(order);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderResponse> getAll() {
        return orderService.getAllOrders().stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/my")
    public List<OrderResponse> getMyOrders(Authentication authentication) {
        return orderService.getOrdersByUsername(authentication.getName()).stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable Long id) {
        return OrderResponse.fromEntity(orderService.getOrderById(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse updateStatus(@PathVariable Long id, @RequestParam String status) {
        OrderStatus orderStatus = OrderStatus.fromValue(status);
        return OrderResponse.fromEntity(orderService.updateOrderStatus(id, orderStatus));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok().build();
    }
}
