package az.premiumreklam.service;

import az.premiumreklam.dto.product.ProductRequest;
import az.premiumreklam.entity.Product;
import az.premiumreklam.enums.ProductStatus;
import az.premiumreklam.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
