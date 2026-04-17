package az.premiumreklam.service;

import az.premiumreklam.dto.product.ProductRequest;
import az.premiumreklam.entity.Product;
import az.premiumreklam.enums.ProductStatus;
import az.premiumreklam.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Product create(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .category(request.getCategory())
                .description(request.getDescription())
                .unit(request.getUnit())
                .purchasePrice(request.getPurchasePrice())
                .salePrice(request.getSalePrice())
                .stockQuantity(request.getStockQuantity())
                .minStockLevel(request.getMinStockLevel())
                .width(request.getWidth())
                .height(request.getHeight())
                .status(ProductStatus.ACTIVE)
                .build();

        return productRepository.save(product);
    }

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Product getById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Məhsul tapılmadı"));
    }

    public Product update(UUID id, ProductRequest request) {
        Product product = getById(id);
        
        if (request.getName() != null) product.setName(request.getName());
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getCategory() != null) product.setCategory(request.getCategory());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getUnit() != null) product.setUnit(request.getUnit());
        if (request.getPurchasePrice() != null) product.setPurchasePrice(request.getPurchasePrice());
        if (request.getSalePrice() != null) product.setSalePrice(request.getSalePrice());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getMinStockLevel() != null) product.setMinStockLevel(request.getMinStockLevel());
        if (request.getWidth() != null) product.setWidth(request.getWidth());
        if (request.getHeight() != null) product.setHeight(request.getHeight());

        return productRepository.save(product);
    }

    @Transactional
    public void delete(UUID id) {
        Product product = getById(id);
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    public List<String> getCategories() {
        List<Product> products = productRepository.findAll();
        Set<String> categories = new HashSet<>();
        for (Product p : products) {
            if (p.getCategory() != null && !p.getCategory().isEmpty()) {
                categories.add(p.getCategory());
            }
        }
        return List.copyOf(categories);
    }
}