package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.customer.CreateCustomerRequest;
import com.quickbooks.dto.customer.CustomerResponse;
import com.quickbooks.dto.customer.UpdateCustomerActiveRequest;
import com.quickbooks.dto.customer.UpdateCustomerRequest;
import com.quickbooks.dto.sale.SaleResponse;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.dto.ledger.PartyLedgerPageResponse;
import com.quickbooks.dto.ledger.PartyLedgerSummaryResponse;
import com.quickbooks.service.CustomerService;
import com.quickbooks.service.PartyLedgerService;
import com.quickbooks.service.SaleService;
import com.quickbooks.service.StaffAccessService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/subscriber/customers")
public class SubscriberCustomerController {

    private final CustomerService customerService;
    private final SaleService saleService;
    private final PartyLedgerService partyLedgerService;
    private final StaffAccessService staffAccessService;

    public SubscriberCustomerController(CustomerService customerService,
                                        SaleService saleService,
                                        PartyLedgerService partyLedgerService,
                                        StaffAccessService staffAccessService) {
        this.customerService = customerService;
        this.saleService = saleService;
        this.partyLedgerService = partyLedgerService;
        this.staffAccessService = staffAccessService;
    }

    @GetMapping
    public PageResponse<CustomerResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        staffAccessService.requireCustomerPicker(principal);
        return customerService.findPage(principal.getId(), principal.getCompanyId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long id) {
        staffAccessService.requireCustomerView(principal);
        return customerService.getById(principal.getId(), principal.getCompanyId(), id);
    }

    @GetMapping("/{id}/account-summary")
    public PartyLedgerSummaryResponse accountSummary(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable Long id) {
        staffAccessService.requireCustomerView(principal);
        return partyLedgerService.getCustomerAccountSummary(principal.getId(), principal.getCompanyId(), id);
    }

    @GetMapping("/{id}/ledger")
    public PartyLedgerPageResponse ledger(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        staffAccessService.requireCustomerView(principal);
        return partyLedgerService.getCustomerLedger(principal.getId(), principal.getCompanyId(), id, page, size, fromDate, toDate);
    }

    @GetMapping("/{id}/sales")
    public PageResponse<SaleResponse> listSales(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "ALL") PaymentListFilter paymentFilter) {
        staffAccessService.requireSaleView(principal);
        return saleService.findPageByCustomer(principal.getId(), principal.getCompanyId(), id, page, size, paymentFilter);
    }

    @PostMapping
    public CustomerResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CreateCustomerRequest request) {
        staffAccessService.requireCustomerCreate(principal);
        return customerService.create(principal.getId(), principal.getCompanyId(), request);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long id,
                                   @Valid @RequestBody UpdateCustomerRequest request) {
        staffAccessService.requireCustomerEdit(principal);
        return customerService.update(principal.getId(), principal.getCompanyId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public CustomerResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id,
                                         @Valid @RequestBody UpdateCustomerActiveRequest request) {
        staffAccessService.requireCustomerEdit(principal);
        return customerService.updateActive(principal.getId(), principal.getCompanyId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        staffAccessService.requireCustomerDelete(principal);
        customerService.delete(principal.getId(), principal.getCompanyId(), id);
    }
}
