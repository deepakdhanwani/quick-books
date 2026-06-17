package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.purchase.PurchaseResponse;
import com.quickbooks.dto.vendor.CreateVendorRequest;
import com.quickbooks.dto.vendor.UpdateVendorActiveRequest;
import com.quickbooks.dto.vendor.UpdateVendorRequest;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.dto.ledger.PartyLedgerPageResponse;
import com.quickbooks.dto.ledger.PartyLedgerSummaryResponse;
import com.quickbooks.service.PartyLedgerService;
import com.quickbooks.service.PurchaseService;
import com.quickbooks.service.StaffAccessService;
import com.quickbooks.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/subscriber/vendors")
public class SubscriberVendorController {

    private final VendorService vendorService;
    private final PurchaseService purchaseService;
    private final PartyLedgerService partyLedgerService;
    private final StaffAccessService staffAccessService;

    public SubscriberVendorController(VendorService vendorService,
                                      PurchaseService purchaseService,
                                      PartyLedgerService partyLedgerService,
                                      StaffAccessService staffAccessService) {
        this.vendorService = vendorService;
        this.purchaseService = purchaseService;
        this.partyLedgerService = partyLedgerService;
        this.staffAccessService = staffAccessService;
    }

    @GetMapping
    public PageResponse<VendorResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        staffAccessService.requireVendorPicker(principal);
        return vendorService.findPage(principal.getId(), principal.getCompanyId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public VendorResponse get(@AuthenticationPrincipal UserPrincipal principal,
                              @PathVariable Long id) {
        staffAccessService.requireVendorView(principal);
        return vendorService.getById(principal.getId(), principal.getCompanyId(), id);
    }

    @GetMapping("/{id}/account-summary")
    public PartyLedgerSummaryResponse accountSummary(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable Long id) {
        staffAccessService.requireVendorView(principal);
        return partyLedgerService.getVendorAccountSummary(principal.getId(), principal.getCompanyId(), id);
    }

    @GetMapping("/{id}/ledger")
    public PartyLedgerPageResponse ledger(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        staffAccessService.requireVendorView(principal);
        return partyLedgerService.getVendorLedger(principal.getId(), principal.getCompanyId(), id, page, size, fromDate, toDate);
    }

    @GetMapping("/{id}/purchases")
    public PageResponse<PurchaseResponse> listPurchases(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "ALL") PaymentListFilter paymentFilter) {
        staffAccessService.requirePurchaseView(principal);
        return purchaseService.findPageByVendor(principal.getId(), principal.getCompanyId(), id, page, size, paymentFilter);
    }

    @PostMapping
    public VendorResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody CreateVendorRequest request) {
        staffAccessService.requireVendorCreate(principal);
        return vendorService.create(principal.getId(), principal.getCompanyId(), request);
    }

    @PutMapping("/{id}")
    public VendorResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateVendorRequest request) {
        staffAccessService.requireVendorEdit(principal);
        return vendorService.update(principal.getId(), principal.getCompanyId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public VendorResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id,
                                       @Valid @RequestBody UpdateVendorActiveRequest request) {
        staffAccessService.requireVendorEdit(principal);
        return vendorService.updateActive(principal.getId(), principal.getCompanyId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        staffAccessService.requireVendorDelete(principal);
        vendorService.delete(principal.getId(), principal.getCompanyId(), id);
    }
}
