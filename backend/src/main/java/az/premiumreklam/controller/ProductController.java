package az.premiumreklam.controller;

import az.premiumreklam.dto.product.ProductRequest;
import az.premiumreklam.dto.product.UserPriceRequest;
import az.premiumreklam.entity.Product;
import az.premiumreklam.entity.UserPrice;
import az.premiumreklam.service.ProductService;
import az.premiumreklam.service.UserPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final UserPriceService userPriceService;

    @GetMapping
    public List<Product> getAll() {
        return productService.getAll();
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/{id}/price")
    public BigDecimal getPrice(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        if (userId != null) {
            return userPriceService.getPriceForUser(userId, id);
        }
        return productService.getById(id).getSalePrice();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Product create(@RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product update(@PathVariable Long id, @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok().build();
    }

    // User Price Management
    @GetMapping("/user-prices/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserPrice> getUserPrices(@PathVariable Long userId) {
        return userPriceService.getUserPrices(userId);
    }

    @GetMapping("/user-prices/{userId}/product/{productId}")
    public BigDecimal getUserProductPrice(@PathVariable Long userId, @PathVariable Long productId) {
        return userPriceService.getPriceForUser(userId, productId);
    }

    @PostMapping("/user-prices")
    @PreAuthorize("hasRole('ADMIN')")
    public UserPrice setUserPrice(@RequestBody UserPriceRequest request) {
        return userPriceService.setUserPrice(request);
    }

    @DeleteMapping("/user-prices/{userId}/product/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUserPrice(@PathVariable Long userId, @PathVariable Long productId) {
        userPriceService.deleteUserPrice(userId, productId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return productService.getCategories();
    }
}
