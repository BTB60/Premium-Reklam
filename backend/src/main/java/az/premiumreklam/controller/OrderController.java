package az.premiumreklam.controller;

import az.premiumreklam.dto.order.OrderRequest;
import az.premiumreklam.entity.Order;
import az.premiumreklam.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public Order create(@RequestBody OrderRequest request, Authentication authentication) {
        return orderService.createOrder(request, authentication.getName());
    }
}
