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

    public SubscriberCustomerController(CustomerService customerService,
                                        SaleService saleService,
                                        PartyLedgerService partyLedgerService) {
        this.customerService = customerService;
        this.saleService = saleService;
        this.partyLedgerService = partyLedgerService;
    }

    @GetMapping
    public PageResponse<CustomerResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return customerService.findPage(principal.getId(), principal.getCompanyId(), page, size, active, search);
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long id) {
        return customerService.getById(principal.getId(), principal.getCompanyId(), id);
    }

    @GetMapping("/{id}/account-summary")
    public PartyLedgerSummaryResponse accountSummary(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable Long id) {
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
        return partyLedgerService.getCustomerLedger(principal.getId(), principal.getCompanyId(), id, page, size, fromDate, toDate);
    }

    @GetMapping("/{id}/sales")
    public PageResponse<SaleResponse> listSales(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "ALL") PaymentListFilter paymentFilter) {
        return saleService.findPageByCustomer(principal.getId(), principal.getCompanyId(), id, page, size, paymentFilter);
    }

    @PostMapping
    public CustomerResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CreateCustomerRequest request) {
        return customerService.create(principal.getId(), principal.getCompanyId(), request);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long id,
                                   @Valid @RequestBody UpdateCustomerRequest request) {
        return customerService.update(principal.getId(), principal.getCompanyId(), id, request);
    }

    @PatchMapping("/{id}/active")
    public CustomerResponse updateActive(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id,
                                         @Valid @RequestBody UpdateCustomerActiveRequest request) {
        return customerService.updateActive(principal.getId(), principal.getCompanyId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        customerService.delete(principal.getId(), principal.getCompanyId(), id);
    }
}
