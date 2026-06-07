package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.customer.CreateCustomerRequest;
import com.quickbooks.dto.customer.CustomerResponse;
import com.quickbooks.dto.customer.UpdateCustomerActiveRequest;
import com.quickbooks.dto.customer.UpdateCustomerRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriber/customers")
public class SubscriberCustomerController {

    private final CustomerService customerService;

    public SubscriberCustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public PageResponse<CustomerResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return customerService.findPage(principal.getId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long id) {
        return customerService.getById(principal.getId(), id);
    }

    @PostMapping
    public CustomerResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CreateCustomerRequest request) {
        return customerService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long id,
                                   @Valid @RequestBody UpdateCustomerRequest request) {
        return customerService.update(principal.getId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public CustomerResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id,
                                         @Valid @RequestBody UpdateCustomerActiveRequest request) {
        return customerService.updateActive(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        customerService.delete(principal.getId(), id);
    }
}
