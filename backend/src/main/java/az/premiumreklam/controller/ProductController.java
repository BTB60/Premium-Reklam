package az.premiumreklam.controller;

import az.premiumreklam.dto.product.ProductRequest;
import az.premiumreklam.entity.Product;
import az.premiumreklam.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {
    "https://premium-reklam.vercel.app",
    "https://premium-reklam.az",
    "http://localhost:3000",
    "*"
})
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // ✅ GET /api/products — список всех товаров
    @GetMapping
    public ResponseEntity<List<Product>> getAll() {
        try {
            List<Product> products = productService.getAll();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ GET /api/products/{id} — товар по ID (UUID)
    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable String id) {
        try {
            // Конвертируем String → UUID
            UUID uuid = UUID.fromString(id);
            Product product = productService.getById(uuid);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ POST /api/products — создать товар (использует ProductRequest DTO)
    @PostMapping
    public ResponseEntity<Product> create(@RequestBody ProductRequest request) {
        try {
            Product created = productService.create(request);
            return ResponseEntity.status(201).body(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ PUT /api/products/{id} — обновить товар
    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable String id, @RequestBody ProductRequest request) {
        try {
            UUID uuid = UUID.fromString(id);
            Product updated = productService.update(uuid, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ DELETE /api/products/{id} — удалить товар (мягкое удаление)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            productService.delete(uuid);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ GET /api/products/categories — список категорий
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        try {
            List<String> categories = productService.getCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}