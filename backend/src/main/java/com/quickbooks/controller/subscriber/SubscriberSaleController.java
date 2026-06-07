package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.sale.CreateSaleRequest;
import com.quickbooks.dto.sale.NextInvoiceNumberResponse;
import com.quickbooks.dto.sale.SaleResponse;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.SaleService;
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
@RequestMapping("/api/subscriber/sales")
public class SubscriberSaleController {

    private final SaleService saleService;

    public SubscriberSaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public PageResponse<SaleResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return saleService.findPage(principal.getId(), page, size, search);
    }

    @GetMapping("/next-invoice-number")
    public NextInvoiceNumberResponse nextInvoiceNumber(@AuthenticationPrincipal UserPrincipal principal) {
        return saleService.getNextInvoiceNumber(principal.getId());
    }

    @GetMapping("/{id}")
    public SaleResponse get(@AuthenticationPrincipal UserPrincipal principal,
                              @PathVariable Long id) {
        return saleService.getById(principal.getId(), id);
    }

    @PostMapping
    public SaleResponse create(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody CreateSaleRequest request) {
        return saleService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public SaleResponse update(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id,
                               @Valid @RequestBody CreateSaleRequest request) {
        return saleService.update(principal.getId(), id, request);
    }

    @PostMapping(value = "/{id}/payments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SaleResponse receivePayment(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id,
                                       @RequestParam BigDecimal amount,
                                       @RequestParam PaymentMode paymentMode,
                                       @RequestParam(required = false) LocalDate date,
                                       @RequestParam(required = false) String paymentDetails,
                                       @RequestParam(required = false) String notes,
                                       @RequestPart("proof") MultipartFile proof) {
        return saleService.receivePayment(
                principal.getId(),
                id,
                amount,
                date,
                paymentMode,
                paymentDetails,
                notes,
                proof
        );
    }

    @GetMapping("/payments/{paymentId}/proof")
    public ResponseEntity<Resource> downloadProof(@AuthenticationPrincipal UserPrincipal principal,
                                                  @PathVariable Long paymentId) {
        Resource resource = saleService.getPaymentProof(principal.getId(), paymentId);
        String fileName = saleService.getPaymentProofFileName(principal.getId(), paymentId);
        String contentType = saleService.getPaymentProofContentType(principal.getId(), paymentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
