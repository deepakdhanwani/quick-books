package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.product.CreateProductRequest;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.product.UpdateProductActiveRequest;
import com.quickbooks.dto.product.UpdateProductRequest;
import com.quickbooks.entity.Product;
import com.quickbooks.entity.Company;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
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
    private final CompanyService companyService;
    private final AuditLogService auditLogService;

    public ProductService(ProductRepository productRepository,
                          SubscriberService subscriberService,
                          CompanyService companyService,
                          AuditLogService auditLogService) {
        this.productRepository = productRepository;
        this.subscriberService = subscriberService;
        this.companyService = companyService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findPage(Long subscriberId, int page, int size, Boolean active, String search) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        return findPage(subscriberId, companyId, page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findPage(Long subscriberId, Long companyId, int page, int size, Boolean active, String search) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = normalizeOptional(search);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<Product> result = productRepository.findBySubscriber(subscriberId, companyId, active, normalizedSearch, pageable);

        return PageResponse.from(result.map(ProductResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long subscriberId, Long productId) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        return getById(subscriberId, companyId, productId);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long subscriberId, Long companyId, Long productId) {
        return ProductResponse.from(getOwnedProduct(subscriberId, companyId, productId));
    }

    @Transactional(readOnly = true)
    public Product getOwnedEntity(Long subscriberId, Long productId) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        return getOwnedEntity(subscriberId, companyId, productId);
    }

    @Transactional(readOnly = true)
    public Product getOwnedEntity(Long subscriberId, Long companyId, Long productId) {
        return getOwnedProduct(subscriberId, companyId, productId);
    }

    @Transactional
    public ProductResponse create(Long subscriberId, CreateProductRequest request) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        return create(subscriberId, companyId, request);
    }

    @Transactional
    public ProductResponse create(Long subscriberId, Long companyId, CreateProductRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Company company = companyService.requireAccessibleCompany(subscriberId, companyId);
        String name = normalizeName(request.getName());

        if (productRepository.existsBySubscriberIdAndCompanyIdAndNameIgnoreCase(subscriberId, companyId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product with this name already exists");
        }

        BigDecimal sellingPrice = normalizePrice(request.getSellingPrice(), "Selling price");
        BigDecimal discount = normalizeDiscount(request.getDiscount(), sellingPrice);

        Product product = new Product();
        product.setSubscriber(subscriber);
        product.setCompany(company);
        product.setName(name);
        product.setSellingPrice(sellingPrice);
        product.setDiscount(discount);
        product.setActive(request.getActive() == null || request.getActive());

        Product saved = productRepository.save(product);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.PRODUCT, saved.getId(), saved.getName());
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(Long subscriberId, Long productId, UpdateProductRequest request) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        return update(subscriberId, companyId, productId, request);
    }

    @Transactional
    public ProductResponse update(Long subscriberId, Long companyId, Long productId, UpdateProductRequest request) {
        Product product = getOwnedProduct(subscriberId, companyId, productId);
        String name = normalizeName(request.getName());

        if (productRepository.existsBySubscriberIdAndCompanyIdAndNameIgnoreCaseAndIdNot(subscriberId, companyId, name, productId)) {
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

        Product saved = productRepository.save(product);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PRODUCT, saved.getId(), saved.getName());
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse updateActive(Long subscriberId, Long productId, UpdateProductActiveRequest request) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        return updateActive(subscriberId, companyId, productId, request);
    }

    @Transactional
    public ProductResponse updateActive(Long subscriberId, Long companyId, Long productId, UpdateProductActiveRequest request) {
        Product product = getOwnedProduct(subscriberId, companyId, productId);
        product.setActive(request.getActive());
        Product saved = productRepository.save(product);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PRODUCT, saved.getId(),
                saved.getName() + " active=" + saved.isActive());
        return ProductResponse.from(saved);
    }

    @Transactional
    public void delete(Long subscriberId, Long productId) {
        Long companyId = companyService.ensureDefaultCompany(subscriberId, "Default Company").getId();
        delete(subscriberId, companyId, productId);
    }

    @Transactional
    public void delete(Long subscriberId, Long companyId, Long productId) {
        Product product = getOwnedProduct(subscriberId, companyId, productId);
        auditLogService.log(AuditAction.DELETE, AuditEntityType.PRODUCT, product.getId(), product.getName());
        productRepository.delete(product);
    }

    private Product getOwnedProduct(Long subscriberId, Long companyId, Long productId) {
        return productRepository.findByIdAndSubscriberIdAndCompanyId(productId, subscriberId, companyId)
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
