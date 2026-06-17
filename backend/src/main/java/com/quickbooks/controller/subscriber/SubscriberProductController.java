package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.product.CreateProductRequest;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.product.UpdateProductActiveRequest;
import com.quickbooks.dto.product.UpdateProductRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.ProductService;
import com.quickbooks.service.StaffAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriber/products")
public class SubscriberProductController {

    private final ProductService productService;
    private final StaffAccessService staffAccessService;

    public SubscriberProductController(ProductService productService,
                                       StaffAccessService staffAccessService) {
        this.productService = productService;
        this.staffAccessService = staffAccessService;
    }

    @GetMapping
    public PageResponse<ProductResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        staffAccessService.requireProductPicker(principal);
        return productService.findPage(principal.getId(), principal.getCompanyId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id) {
        staffAccessService.requireProductView(principal);
        return productService.getById(principal.getId(), principal.getCompanyId(), id);
    }

    @PostMapping
    public ProductResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody CreateProductRequest request) {
        staffAccessService.requireProductCreate(principal);
        return productService.create(principal.getId(), principal.getCompanyId(), request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long id,
                                  @Valid @RequestBody UpdateProductRequest request) {
        staffAccessService.requireProductEdit(principal);
        return productService.update(principal.getId(), principal.getCompanyId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public ProductResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable Long id,
                                        @Valid @RequestBody UpdateProductActiveRequest request) {
        staffAccessService.requireProductEdit(principal);
        return productService.updateActive(principal.getId(), principal.getCompanyId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        staffAccessService.requireProductDelete(principal);
        productService.delete(principal.getId(), principal.getCompanyId(), id);
    }
}
