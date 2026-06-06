package com.quickbooks.controller.admin;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.discount.CreateDiscountRequest;
import com.quickbooks.dto.discount.DiscountResponse;
import com.quickbooks.dto.discount.UpdateDiscountRequest;
import com.quickbooks.service.DiscountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/discounts")
public class AdminDiscountController {

    private final DiscountService discountService;

    public AdminDiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public PageResponse<DiscountResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return discountService.findPage(page, size);
    }

    @PostMapping
    public DiscountResponse create(@Valid @RequestBody CreateDiscountRequest request) {
        return discountService.create(request);
    }

    @PutMapping("/{id}")
    public DiscountResponse update(@PathVariable Long id,
                                 @Valid @RequestBody UpdateDiscountRequest request) {
        return discountService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        discountService.delete(id);
    }
}
