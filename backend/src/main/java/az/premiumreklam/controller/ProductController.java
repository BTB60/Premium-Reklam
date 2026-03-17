package az.premiumreklam.controller;

import az.premiumreklam.dto.product.ProductRequest;
import az.premiumreklam.entity.Product;
import az.premiumreklam.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('KASSIR')")
    public Product create(@RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @GetMapping
    public List<Product> getAll() {
        return productService.getAll();
    }
}
