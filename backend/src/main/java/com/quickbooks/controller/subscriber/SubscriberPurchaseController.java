package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.purchase.CreatePurchaseRequest;
import com.quickbooks.dto.purchase.NextBillNumberResponse;
import com.quickbooks.dto.purchase.PurchaseResponse;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentSettlementType;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/subscriber/purchases")
public class SubscriberPurchaseController {

    private final PurchaseService purchaseService;

    public SubscriberPurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    public PageResponse<PurchaseResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentListFilter paymentFilter) {
        return purchaseService.findPage(principal.getId(), page, size, search, paymentFilter);
    }

    @GetMapping("/next-bill-number")
    public NextBillNumberResponse nextBillNumber(@AuthenticationPrincipal UserPrincipal principal) {
        return purchaseService.getNextBillNumber(principal.getId());
    }

    @GetMapping("/{id}")
    public PurchaseResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long id) {
        return purchaseService.getById(principal.getId(), id);
    }

    @PostMapping
    public PurchaseResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CreatePurchaseRequest request) {
        return purchaseService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public PurchaseResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long id,
                                   @Valid @RequestBody CreatePurchaseRequest request) {
        return purchaseService.update(principal.getId(), id, request);
    }

    @PostMapping(value = "/{id}/payments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PurchaseResponse makePayment(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable Long id,
                                        @RequestParam BigDecimal amount,
                                        @RequestParam PaymentMode paymentMode,
                                        @RequestParam(required = false) PaymentSettlementType settlementType,
                                        @RequestParam(required = false) LocalDate date,
                                        @RequestParam(required = false) String paymentDetails,
                                        @RequestParam(required = false) String notes,
                                        @RequestPart(value = "proof", required = false) MultipartFile proof) {
        return purchaseService.makePayment(
                principal.getId(),
                id,
                amount,
                date,
                paymentMode,
                settlementType,
                paymentDetails,
                notes,
                proof
        );
    }

    @GetMapping("/payments/{paymentId}/proof")
    public ResponseEntity<Resource> downloadProof(@AuthenticationPrincipal UserPrincipal principal,
                                                  @PathVariable Long paymentId) {
        Resource resource = purchaseService.getPaymentProof(principal.getId(), paymentId);
        String fileName = purchaseService.getPaymentProofFileName(principal.getId(), paymentId);
        String contentType = purchaseService.getPaymentProofContentType(principal.getId(), paymentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
