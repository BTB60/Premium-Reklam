package az.premiumreklam.controller;

import az.premiumreklam.dto.order.OrderRequest;
import az.premiumreklam.entity.Order;
import az.premiumreklam.enums.OrderStatus;
import az.premiumreklam.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public Order create(@RequestBody OrderRequest request, Authentication authentication) {
        return orderService.createOrder(request, authentication.getName());
    }

    @GetMapping
    public List<Order> getAll(Authentication authentication) {
        return orderService.getAllOrders();
    }

    @GetMapping("/my")
    public List<Order> getMyOrders(Authentication authentication) {
        return orderService.getOrdersByUsername(authentication.getName());
    }

    @GetMapping("/{id}")
    public Order getById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Order updateStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return orderService.updateOrderStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok().build();
    }
}
