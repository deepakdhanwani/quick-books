package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.product.CreateProductRequest;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.product.UpdateProductActiveRequest;
import com.quickbooks.dto.product.UpdateProductRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriber/products")
public class SubscriberProductController {

    private final ProductService productService;

    public SubscriberProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return productService.findPage(principal.getId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id) {
        return productService.getById(principal.getId(), id);
    }

    @PostMapping
    public ProductResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody CreateProductRequest request) {
        return productService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long id,
                                  @Valid @RequestBody UpdateProductRequest request) {
        return productService.update(principal.getId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public ProductResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable Long id,
                                        @Valid @RequestBody UpdateProductActiveRequest request) {
        return productService.updateActive(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        productService.delete(principal.getId(), id);
    }
}
