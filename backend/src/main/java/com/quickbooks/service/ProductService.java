package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.product.CreateProductRequest;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.product.UpdateProductActiveRequest;
import com.quickbooks.dto.product.UpdateProductRequest;
import com.quickbooks.entity.Product;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final SubscriberService subscriberService;

    public ProductService(ProductRepository productRepository,
                          SubscriberService subscriberService) {
        this.productRepository = productRepository;
        this.subscriberService = subscriberService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findPage(Long subscriberId, int page, int size, Boolean active, String search) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = normalizeOptional(search);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<Product> result = productRepository.findBySubscriber(subscriberId, active, normalizedSearch, pageable);

        return PageResponse.from(result.map(ProductResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long subscriberId, Long productId) {
        return ProductResponse.from(getOwnedProduct(subscriberId, productId));
    }

    @Transactional(readOnly = true)
    public Product getOwnedEntity(Long subscriberId, Long productId) {
        return getOwnedProduct(subscriberId, productId);
    }

    @Transactional
    public ProductResponse create(Long subscriberId, CreateProductRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        String name = normalizeName(request.getName());

        if (productRepository.existsBySubscriberIdAndNameIgnoreCase(subscriberId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product with this name already exists");
        }

        BigDecimal sellingPrice = normalizePrice(request.getSellingPrice(), "Selling price");
        BigDecimal discount = normalizeDiscount(request.getDiscount(), sellingPrice);

        Product product = new Product();
        product.setSubscriber(subscriber);
        product.setName(name);
        product.setSellingPrice(sellingPrice);
        product.setDiscount(discount);
        product.setActive(request.getActive() == null || request.getActive());

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long subscriberId, Long productId, UpdateProductRequest request) {
        Product product = getOwnedProduct(subscriberId, productId);
        String name = normalizeName(request.getName());

        if (productRepository.existsBySubscriberIdAndNameIgnoreCaseAndIdNot(subscriberId, name, productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product with this name already exists");
        }

        BigDecimal sellingPrice = normalizePrice(request.getSellingPrice(), "Selling price");
        BigDecimal discount = normalizeDiscount(request.getDiscount(), sellingPrice);

        product.setName(name);
        product.setSellingPrice(sellingPrice);
        product.setDiscount(discount);
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateActive(Long subscriberId, Long productId, UpdateProductActiveRequest request) {
        Product product = getOwnedProduct(subscriberId, productId);
        product.setActive(request.getActive());
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void delete(Long subscriberId, Long productId) {
        Product product = getOwnedProduct(subscriberId, productId);
        productRepository.delete(product);
    }

    private Product getOwnedProduct(Long subscriberId, Long productId) {
        return productRepository.findByIdAndSubscriberId(productId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private BigDecimal normalizePrice(BigDecimal value, String label) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        BigDecimal normalized = value.setScale(2, RoundingMode.HALF_UP);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be greater than zero");
        }
        return normalized;
    }

    private BigDecimal normalizeDiscount(BigDecimal value, BigDecimal sellingPrice) {
        BigDecimal discount = value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Discount cannot be negative");
        }
        if (discount.compareTo(sellingPrice) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Discount cannot exceed selling price");
        }
        BigDecimal netAmount = ProductResponse.calculateNetAmount(sellingPrice, discount);
        if (netAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Net amount must be greater than zero");
        }
        return discount;
    }

    private String normalizeName(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
