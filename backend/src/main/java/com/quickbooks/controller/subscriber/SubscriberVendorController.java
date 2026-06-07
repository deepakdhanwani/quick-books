package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.vendor.CreateVendorRequest;
import com.quickbooks.dto.vendor.UpdateVendorActiveRequest;
import com.quickbooks.dto.vendor.UpdateVendorRequest;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriber/vendors")
public class SubscriberVendorController {

    private final VendorService vendorService;

    public SubscriberVendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public PageResponse<VendorResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return vendorService.findPage(principal.getId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public VendorResponse get(@AuthenticationPrincipal UserPrincipal principal,
                              @PathVariable Long id) {
        return vendorService.getById(principal.getId(), id);
    }

    @PostMapping
    public VendorResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody CreateVendorRequest request) {
        return vendorService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public VendorResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateVendorRequest request) {
        return vendorService.update(principal.getId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public VendorResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id,
                                       @Valid @RequestBody UpdateVendorActiveRequest request) {
        return vendorService.updateActive(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        vendorService.delete(principal.getId(), id);
    }
}
