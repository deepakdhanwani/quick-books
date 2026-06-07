package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.purchase.CreatePurchaseItemRequest;
import com.quickbooks.dto.purchase.CreatePurchaseRequest;
import com.quickbooks.dto.purchase.NextBillNumberResponse;
import com.quickbooks.dto.purchase.PurchaseItemResponse;
import com.quickbooks.dto.purchase.PurchasePaymentResponse;
import com.quickbooks.dto.purchase.PurchaseResponse;
import com.quickbooks.entity.Payment;
import com.quickbooks.entity.Product;
import com.quickbooks.entity.Purchase;
import com.quickbooks.entity.PurchaseItem;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.Vendor;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentSettlementType;
import com.quickbooks.entity.enums.PaymentStatus;
import com.quickbooks.entity.enums.PaymentType;
import com.quickbooks.entity.enums.ReferenceType;
import com.quickbooks.repository.PaymentRepository;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.VendorRepository;
import com.quickbooks.util.InvoiceNumberGenerator;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PaymentRepository paymentRepository;
    private final VendorRepository vendorRepository;
    private final SubscriberService subscriberService;
    private final ProductService productService;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           PaymentRepository paymentRepository,
                           VendorRepository vendorRepository,
                           SubscriberService subscriberService,
                           ProductService productService,
                           FileStorageService fileStorageService,
                           AuditLogService auditLogService) {
        this.purchaseRepository = purchaseRepository;
        this.paymentRepository = paymentRepository;
        this.vendorRepository = vendorRepository;
        this.subscriberService = subscriberService;
        this.productService = productService;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> findPage(Long subscriberId,
                                                     int page,
                                                     int size,
                                                     String search,
                                                     PaymentListFilter paymentFilter,
                                                     LocalDate fromDate,
                                                     LocalDate toDate) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = normalizeOptional(search);
        PaymentListFilter normalizedFilter = paymentFilter != null ? paymentFilter : PaymentListFilter.ALL;

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("date").descending().and(Sort.by("id").descending()));
        Page<PurchaseResponse> result = purchaseRepository.findBySubscriber(
                        subscriberId,
                        normalizedSearch,
                        normalizedFilter.name(),
                        fromDate,
                        toDate,
                        pageable)
                .map(PurchaseResponse::from);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> findPageByVendor(Long subscriberId,
                                                           Long vendorId,
                                                           int page,
                                                           int size,
                                                           PaymentListFilter paymentFilter) {
        vendorRepository.findByIdAndSubscriberId(vendorId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        PaymentListFilter normalizedFilter = paymentFilter != null ? paymentFilter : PaymentListFilter.ALL;

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("date").descending().and(Sort.by("id").descending()));
        Page<PurchaseResponse> result = purchaseRepository.findBySubscriberAndVendor(
                        subscriberId,
                        vendorId,
                        normalizedFilter.name(),
                        pageable)
                .map(PurchaseResponse::from);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public NextBillNumberResponse getNextBillNumber(Long subscriberId) {
        String suggested = suggestNextBillNumber(subscriberId);
        return new NextBillNumberResponse(suggested, true);
    }

    @Transactional(readOnly = true)
    public PurchaseResponse getById(Long subscriberId, Long purchaseId) {
        Purchase purchase = getOwnedPurchase(subscriberId, purchaseId);
        PurchaseResponse response = PurchaseResponse.from(purchase);
        response.setItems(mapPurchaseItems(purchase));
        response.setPayments(loadPayments(subscriberId, purchaseId));
        return response;
    }

    @Transactional
    public PurchaseResponse create(Long subscriberId, CreatePurchaseRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Vendor vendor = vendorRepository.findByIdAndSubscriberId(request.getVendorId(), subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (!vendor.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected vendor is inactive");
        }

        String billNumber = resolveBillNumber(subscriberId, request.getBillNumber());
        if (purchaseRepository.existsBySubscriberIdAndBillNumberIgnoreCase(subscriberId, billNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bill number already exists");
        }

        List<BuiltPurchaseItem> builtItems = buildPurchaseItems(subscriberId, request.getItems());
        AmountBreakdown amounts = calculateAmounts(request, builtItems);

        Purchase purchase = new Purchase();
        purchase.setSubscriber(subscriber);
        purchase.setVendor(vendor);
        purchase.setBillNumber(billNumber);
        purchase.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        purchase.setGrossAmount(amounts.grossAmount());
        purchase.setDiscountAmount(amounts.discountAmount());
        purchase.setTaxPercent(amounts.taxPercent());
        purchase.setTaxAmount(amounts.taxAmount());
        purchase.setTotalAmount(amounts.netAmount());
        purchase.setPaidAmount(BigDecimal.ZERO);
        purchase.setPendingAmount(amounts.netAmount());
        purchase.setPaymentStatus(PaymentStatus.UNPAID);
        purchase.setNotes(normalizeOptional(request.getNotes()));

        attachBuiltItems(purchase, builtItems);

        Purchase saved = purchaseRepository.save(purchase);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.PURCHASE, saved.getId(), saved.getBillNumber());
        PurchaseResponse response = PurchaseResponse.from(saved);
        response.setItems(mapPurchaseItems(saved));
        return response;
    }

    @Transactional
    public PurchaseResponse update(Long subscriberId, Long purchaseId, CreatePurchaseRequest request) {
        Purchase purchase = getOwnedPurchase(subscriberId, purchaseId);

        if (purchase.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Fully paid purchases cannot be edited");
        }

        Vendor vendor = vendorRepository.findByIdAndSubscriberId(request.getVendorId(), subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (!vendor.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected vendor is inactive");
        }

        String billNumber = normalizeRequired(request.getBillNumber(), "Bill number is required");
        if (purchaseRepository.existsBySubscriberIdAndBillNumberIgnoreCaseAndIdNot(subscriberId, billNumber, purchaseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bill number already exists");
        }

        Set<Long> existingProductIds = purchase.getItems().stream()
                .filter(item -> item.getProduct() != null)
                .map(item -> item.getProduct().getId())
                .collect(java.util.stream.Collectors.toSet());

        List<BuiltPurchaseItem> builtItems = buildPurchaseItems(subscriberId, request.getItems(), existingProductIds);
        AmountBreakdown amounts = calculateAmounts(request, builtItems);

        BigDecimal paidAmount = purchase.getPaidAmount();
        if (paidAmount.compareTo(amounts.netAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Net amount cannot be less than amount already paid");
        }

        purchase.setVendor(vendor);
        purchase.setBillNumber(billNumber);
        if (request.getDate() != null) {
            purchase.setDate(request.getDate());
        }
        purchase.setGrossAmount(amounts.grossAmount());
        purchase.setDiscountAmount(amounts.discountAmount());
        purchase.setTaxPercent(amounts.taxPercent());
        purchase.setTaxAmount(amounts.taxAmount());
        purchase.setTotalAmount(amounts.netAmount());
        purchase.setPendingAmount(amounts.netAmount().subtract(paidAmount).max(BigDecimal.ZERO));
        purchase.setPaymentStatus(resolvePaymentStatus(paidAmount, amounts.netAmount()));
        purchase.setNotes(normalizeOptional(request.getNotes()));

        purchase.getItems().clear();
        attachBuiltItems(purchase, builtItems);

        Purchase saved = purchaseRepository.save(purchase);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PURCHASE, saved.getId(), saved.getBillNumber());
        PurchaseResponse response = PurchaseResponse.from(saved);
        response.setItems(mapPurchaseItems(saved));
        response.setPayments(loadPayments(subscriberId, purchaseId));
        return response;
    }

    @Transactional
    public PurchaseResponse makePayment(Long subscriberId,
                                        Long purchaseId,
                                        BigDecimal amount,
                                        LocalDate date,
                                        PaymentMode paymentMode,
                                        PaymentSettlementType settlementType,
                                        String paymentDetails,
                                        String notes,
                                        MultipartFile proofFile) {
        if (paymentMode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment mode is required");
        }

        Purchase purchase = getOwnedPurchase(subscriberId, purchaseId);
        if (purchase.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Purchase is already fully paid");
        }

        BigDecimal paymentAmount = amount.setScale(2, RoundingMode.HALF_UP);
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount must be greater than zero");
        }
        BigDecimal pendingBefore = purchase.getPendingAmount();
        if (paymentAmount.compareTo(pendingBefore) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount exceeds pending balance");
        }

        PaymentSettlementType resolvedSettlementType = resolveSettlementType(paymentAmount, pendingBefore, settlementType);

        FileStorageService.StoredFile storedFile = fileStorageService.storePaymentProof(subscriberId, proofFile);

        Payment payment = new Payment();
        payment.setSubscriber(purchase.getSubscriber());
        payment.setType(PaymentType.PAID);
        payment.setAmount(paymentAmount);
        payment.setDate(date != null ? date : LocalDate.now());
        payment.setReferenceType(ReferenceType.PURCHASE);
        payment.setReferenceId(purchase.getId());
        payment.setPaymentMode(paymentMode);
        payment.setPaymentDetails(normalizeOptional(paymentDetails));
        payment.setNotes(normalizeOptional(notes));
        payment.setSettlementType(resolvedSettlementType);
        if (storedFile != null) {
            payment.setProofFileName(storedFile.originalFileName());
            payment.setProofFilePath(storedFile.relativePath());
            payment.setProofContentType(storedFile.contentType());
        }

        BigDecimal newPaidAmount = purchase.getPaidAmount().add(paymentAmount);
        if (resolvedSettlementType == PaymentSettlementType.SETTLEMENT) {
            BigDecimal adjustment = pendingBefore.subtract(paymentAmount);
            payment.setAdjustedAmount(adjustment);
            purchase.setAdjustedAmount(nullToZero(purchase.getAdjustedAmount()).add(adjustment));
            purchase.setPaidAmount(newPaidAmount);
            purchase.setPendingAmount(BigDecimal.ZERO);
            purchase.setPaymentStatus(PaymentStatus.PAID);
        } else {
            BigDecimal newPendingAmount = pendingBefore.subtract(paymentAmount);
            purchase.setPaidAmount(newPaidAmount);
            purchase.setPendingAmount(newPendingAmount);
            purchase.setPaymentStatus(resolvePaymentStatus(newPaidAmount, purchase.getTotalAmount()));
        }

        Payment savedPayment = paymentRepository.save(payment);
        purchaseRepository.save(purchase);

        auditLogService.log(AuditAction.CREATE, AuditEntityType.PAYMENT, savedPayment.getId(),
                "Paid " + paymentAmount + " for purchase " + purchase.getBillNumber());
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PURCHASE, purchase.getId(), purchase.getBillNumber());

        PurchaseResponse response = PurchaseResponse.from(purchase);
        response.setPayments(loadPayments(subscriberId, purchaseId));
        return response;
    }

    @Transactional(readOnly = true)
    public Resource getPaymentProof(Long subscriberId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndSubscriberId(paymentId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (payment.getProofFilePath() == null || payment.getProofFilePath().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment proof not found");
        }

        try {
            return new UrlResource(fileStorageService.resolveStoredFile(payment.getProofFilePath()).toUri());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment proof not found");
        }
    }

    @Transactional(readOnly = true)
    public String getPaymentProofContentType(Long subscriberId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndSubscriberId(paymentId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (payment.getProofContentType() == null) {
            return "application/octet-stream";
        }
        return payment.getProofContentType();
    }

    @Transactional(readOnly = true)
    public String getPaymentProofFileName(Long subscriberId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndSubscriberId(paymentId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return payment.getProofFileName() != null ? payment.getProofFileName() : "payment-proof";
    }

    private List<PurchasePaymentResponse> loadPayments(Long subscriberId, Long purchaseId) {
        return paymentRepository.findBySale(subscriberId, ReferenceType.PURCHASE, purchaseId, PaymentType.PAID).stream()
                .map(PurchasePaymentResponse::from)
                .toList();
    }

    private String suggestNextBillNumber(Long subscriberId) {
        return purchaseRepository.findFirstBySubscriber_IdOrderByIdDesc(subscriberId)
                .map(Purchase::getBillNumber)
                .map(InvoiceNumberGenerator::suggestNext)
                .orElseGet(InvoiceNumberGenerator::defaultFirstBill);
    }

    private String resolveBillNumber(Long subscriberId, String requestedBillNumber) {
        String trimmed = normalizeOptional(requestedBillNumber);
        if (trimmed != null) {
            return trimmed;
        }
        return suggestNextBillNumber(subscriberId);
    }

    private Purchase getOwnedPurchase(Long subscriberId, Long purchaseId) {
        return purchaseRepository.findByIdAndSubscriberId(purchaseId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase not found"));
    }

    private void attachBuiltItems(Purchase purchase, List<BuiltPurchaseItem> builtItems) {
        for (BuiltPurchaseItem builtItem : builtItems) {
            PurchaseItem purchaseItem = new PurchaseItem();
            purchaseItem.setPurchase(purchase);
            purchaseItem.setProduct(builtItem.product());
            purchaseItem.setDescription(builtItem.product().getName());
            purchaseItem.setQuantity(builtItem.quantity());
            purchaseItem.setUnitPrice(builtItem.product().getSellingPrice());
            purchaseItem.setAmount(builtItem.lineAmount());
            purchase.getItems().add(purchaseItem);
        }
    }

    private List<BuiltPurchaseItem> buildPurchaseItems(Long subscriberId, List<CreatePurchaseItemRequest> items) {
        return buildPurchaseItems(subscriberId, items, Set.of());
    }

    private List<BuiltPurchaseItem> buildPurchaseItems(Long subscriberId,
                                                       List<CreatePurchaseItemRequest> items,
                                                       Set<Long> allowedInactiveProductIds) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }

        List<BuiltPurchaseItem> builtItems = new ArrayList<>();
        for (CreatePurchaseItemRequest itemRequest : items) {
            Product product = productService.getOwnedEntity(subscriberId, itemRequest.getProductId());
            if (!product.isActive() && !allowedInactiveProductIds.contains(product.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected product is inactive: " + product.getName());
            }

            BigDecimal quantity = itemRequest.getQuantity().setScale(2, RoundingMode.HALF_UP);
            if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product quantity must be greater than zero");
            }

            BigDecimal lineGross = product.getSellingPrice().multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineDiscount = nullToZero(product.getDiscount()).multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineAmount = lineGross.subtract(lineDiscount).setScale(2, RoundingMode.HALF_UP);
            if (lineAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product line amount must be greater than zero");
            }

            builtItems.add(new BuiltPurchaseItem(product, quantity, lineGross, lineDiscount, lineAmount));
        }
        return builtItems;
    }

    private List<PurchaseItemResponse> mapPurchaseItems(Purchase purchase) {
        if (purchase.getItems() == null || purchase.getItems().isEmpty()) {
            return List.of();
        }
        return purchase.getItems().stream().map(PurchaseItemResponse::from).toList();
    }

    private AmountBreakdown calculateAmounts(CreatePurchaseRequest request, List<BuiltPurchaseItem> builtItems) {
        BigDecimal grossAmount;
        BigDecimal discountAmount;

        if (!builtItems.isEmpty()) {
            grossAmount = builtItems.stream()
                    .map(BuiltPurchaseItem::lineGross)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            discountAmount = builtItems.stream()
                    .map(BuiltPurchaseItem::lineDiscount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            if (request.getGrossAmount() == null || request.getGrossAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gross amount must be greater than zero");
            }
            grossAmount = request.getGrossAmount().setScale(2, RoundingMode.HALF_UP);
            discountAmount = nullToZero(request.getDiscountAmount()).setScale(2, RoundingMode.HALF_UP);
            if (discountAmount.compareTo(grossAmount) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Discount cannot exceed gross amount");
            }
        }

        BigDecimal taxableAmount = grossAmount.subtract(discountAmount);
        BigDecimal taxPercent = nullToZero(request.getTaxPercent()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = request.getTaxAmount() != null
                ? request.getTaxAmount().setScale(2, RoundingMode.HALF_UP)
                : taxableAmount.multiply(taxPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (taxAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tax amount cannot be negative");
        }

        BigDecimal netAmount = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        if (netAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Net amount must be greater than zero");
        }

        return new AmountBreakdown(grossAmount, discountAmount, taxPercent, taxAmount, netAmount);
    }

    private PaymentSettlementType resolveSettlementType(BigDecimal paymentAmount,
                                                        BigDecimal pendingAmount,
                                                        PaymentSettlementType requested) {
        if (paymentAmount.compareTo(pendingAmount) >= 0) {
            return PaymentSettlementType.FULL;
        }
        if (requested == PaymentSettlementType.PARTIAL || requested == PaymentSettlementType.SETTLEMENT) {
            return requested;
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Choose partial payment or settlement when amount is less than pending balance");
    }

    private PaymentStatus resolvePaymentStatus(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount.compareTo(totalAmount) >= 0) {
            return PaymentStatus.PAID;
        }
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PARTIAL;
        }
        return PaymentStatus.UNPAID;
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return trimmed;
    }

    private record BuiltPurchaseItem(
            Product product,
            BigDecimal quantity,
            BigDecimal lineGross,
            BigDecimal lineDiscount,
            BigDecimal lineAmount
    ) {}

    private record AmountBreakdown(
            BigDecimal grossAmount,
            BigDecimal discountAmount,
            BigDecimal taxPercent,
            BigDecimal taxAmount,
            BigDecimal netAmount
    ) {}
}
