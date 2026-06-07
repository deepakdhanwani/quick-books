package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.sale.CreateSaleItemRequest;
import com.quickbooks.dto.sale.CreateSaleRequest;
import com.quickbooks.dto.sale.NextInvoiceNumberResponse;
import com.quickbooks.dto.sale.SaleItemResponse;
import com.quickbooks.dto.sale.SalePaymentResponse;
import com.quickbooks.dto.sale.SaleResponse;
import com.quickbooks.util.InvoiceNumberGenerator;
import com.quickbooks.entity.Customer;
import com.quickbooks.entity.Payment;
import com.quickbooks.entity.Product;
import com.quickbooks.entity.Sale;
import com.quickbooks.entity.SaleItem;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentSettlementType;
import com.quickbooks.entity.enums.PaymentStatus;
import com.quickbooks.entity.enums.PaymentType;
import com.quickbooks.entity.enums.ReferenceType;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.PaymentRepository;
import com.quickbooks.repository.SaleRepository;
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
public class SaleService {

    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final SubscriberService subscriberService;
    private final ProductService productService;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public SaleService(SaleRepository saleRepository,
                       PaymentRepository paymentRepository,
                       CustomerRepository customerRepository,
                       SubscriberService subscriberService,
                       ProductService productService,
                       FileStorageService fileStorageService,
                       AuditLogService auditLogService) {
        this.saleRepository = saleRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.subscriberService = subscriberService;
        this.productService = productService;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> findPage(Long subscriberId, int page, int size, String search, PaymentListFilter paymentFilter) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = normalizeOptional(search);
        PaymentListFilter normalizedFilter = paymentFilter != null ? paymentFilter : PaymentListFilter.ALL;

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("date").descending().and(Sort.by("id").descending()));
        Page<SaleResponse> result = saleRepository.findBySubscriber(subscriberId, normalizedSearch, normalizedFilter.name(), pageable)
                .map(SaleResponse::from);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public NextInvoiceNumberResponse getNextInvoiceNumber(Long subscriberId) {
        String suggested = suggestNextInvoiceNumber(subscriberId);
        return new NextInvoiceNumberResponse(suggested, true);
    }

    @Transactional(readOnly = true)
    public SaleResponse getById(Long subscriberId, Long saleId) {
        Sale sale = getOwnedSale(subscriberId, saleId);
        SaleResponse response = SaleResponse.from(sale);
        response.setItems(mapSaleItems(sale));
        response.setPayments(loadPayments(subscriberId, saleId));
        return response;
    }

    @Transactional
    public SaleResponse create(Long subscriberId, CreateSaleRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Customer customer = customerRepository.findByIdAndSubscriberId(request.getCustomerId(), subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        if (!customer.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected customer is inactive");
        }

        String invoiceNumber = resolveInvoiceNumber(subscriberId, request.getInvoiceNumber());
        if (saleRepository.existsBySubscriberIdAndInvoiceNumberIgnoreCase(subscriberId, invoiceNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice number already exists");
        }

        List<BuiltSaleItem> builtItems = buildSaleItems(subscriberId, request.getItems());
        AmountBreakdown amounts = calculateAmounts(request, builtItems);

        Sale sale = new Sale();
        sale.setSubscriber(subscriber);
        sale.setCustomer(customer);
        sale.setInvoiceNumber(invoiceNumber);
        sale.setInvoiceDetails(normalizeOptional(request.getInvoiceDetails()));
        sale.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        sale.setGrossAmount(amounts.grossAmount());
        sale.setDiscountAmount(amounts.discountAmount());
        sale.setTaxPercent(amounts.taxPercent());
        sale.setTaxAmount(amounts.taxAmount());
        sale.setTotalAmount(amounts.netAmount());
        sale.setPaidAmount(BigDecimal.ZERO);
        sale.setPendingAmount(amounts.netAmount());
        sale.setPaymentStatus(PaymentStatus.UNPAID);
        sale.setNotes(normalizeOptional(request.getNotes()));

        attachBuiltItems(sale, builtItems);

        Sale saved = saleRepository.save(sale);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.SALE, saved.getId(), saved.getInvoiceNumber());
        SaleResponse response = SaleResponse.from(saved);
        response.setItems(mapSaleItems(saved));
        return response;
    }

    @Transactional
    public SaleResponse update(Long subscriberId, Long saleId, CreateSaleRequest request) {
        Sale sale = getOwnedSale(subscriberId, saleId);

        if (sale.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Fully paid sales cannot be edited");
        }

        Customer customer = customerRepository.findByIdAndSubscriberId(request.getCustomerId(), subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        if (!customer.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected customer is inactive");
        }

        String invoiceNumber = normalizeRequired(request.getInvoiceNumber(), "Invoice number is required");
        if (saleRepository.existsBySubscriberIdAndInvoiceNumberIgnoreCaseAndIdNot(subscriberId, invoiceNumber, saleId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice number already exists");
        }

        Set<Long> existingProductIds = sale.getItems().stream()
                .filter(item -> item.getProduct() != null)
                .map(item -> item.getProduct().getId())
                .collect(java.util.stream.Collectors.toSet());

        List<BuiltSaleItem> builtItems = buildSaleItems(subscriberId, request.getItems(), existingProductIds);
        AmountBreakdown amounts = calculateAmounts(request, builtItems);

        BigDecimal paidAmount = sale.getPaidAmount();
        if (paidAmount.compareTo(amounts.netAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Net amount cannot be less than amount already received");
        }

        sale.setCustomer(customer);
        sale.setInvoiceNumber(invoiceNumber);
        sale.setInvoiceDetails(normalizeOptional(request.getInvoiceDetails()));
        if (request.getDate() != null) {
            sale.setDate(request.getDate());
        }
        sale.setGrossAmount(amounts.grossAmount());
        sale.setDiscountAmount(amounts.discountAmount());
        sale.setTaxPercent(amounts.taxPercent());
        sale.setTaxAmount(amounts.taxAmount());
        sale.setTotalAmount(amounts.netAmount());
        sale.setPendingAmount(amounts.netAmount().subtract(paidAmount).max(BigDecimal.ZERO));
        sale.setPaymentStatus(resolvePaymentStatus(paidAmount, amounts.netAmount()));
        sale.setNotes(normalizeOptional(request.getNotes()));

        sale.getItems().clear();
        attachBuiltItems(sale, builtItems);

        Sale saved = saleRepository.save(sale);
        SaleResponse response = SaleResponse.from(saved);
        response.setItems(mapSaleItems(saved));
        response.setPayments(loadPayments(subscriberId, saleId));
        return response;
    }

    @Transactional
    public SaleResponse receivePayment(Long subscriberId,
                                       Long saleId,
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

        Sale sale = getOwnedSale(subscriberId, saleId);
        if (sale.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sale is already fully paid");
        }

        BigDecimal paymentAmount = amount.setScale(2, RoundingMode.HALF_UP);
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount must be greater than zero");
        }
        BigDecimal pendingBefore = sale.getPendingAmount();
        if (paymentAmount.compareTo(pendingBefore) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount exceeds pending balance");
        }

        PaymentSettlementType resolvedSettlementType = resolveSettlementType(paymentAmount, pendingBefore, settlementType);

        FileStorageService.StoredFile storedFile = fileStorageService.storePaymentProof(subscriberId, proofFile);

        Payment payment = new Payment();
        payment.setSubscriber(sale.getSubscriber());
        payment.setType(PaymentType.RECEIVED);
        payment.setAmount(paymentAmount);
        payment.setDate(date != null ? date : LocalDate.now());
        payment.setReferenceType(ReferenceType.SALE);
        payment.setReferenceId(sale.getId());
        payment.setPaymentMode(paymentMode);
        payment.setPaymentDetails(normalizeOptional(paymentDetails));
        payment.setNotes(normalizeOptional(notes));
        payment.setSettlementType(resolvedSettlementType);
        if (storedFile != null) {
            payment.setProofFileName(storedFile.originalFileName());
            payment.setProofFilePath(storedFile.relativePath());
            payment.setProofContentType(storedFile.contentType());
        }

        BigDecimal newPaidAmount = sale.getPaidAmount().add(paymentAmount);
        if (resolvedSettlementType == PaymentSettlementType.SETTLEMENT) {
            BigDecimal adjustment = pendingBefore.subtract(paymentAmount);
            payment.setAdjustedAmount(adjustment);
            sale.setAdjustedAmount(nullToZero(sale.getAdjustedAmount()).add(adjustment));
            sale.setPaidAmount(newPaidAmount);
            sale.setPendingAmount(BigDecimal.ZERO);
            sale.setPaymentStatus(PaymentStatus.PAID);
        } else {
            BigDecimal newPendingAmount = pendingBefore.subtract(paymentAmount);
            sale.setPaidAmount(newPaidAmount);
            sale.setPendingAmount(newPendingAmount);
            sale.setPaymentStatus(resolvePaymentStatus(newPaidAmount, sale.getTotalAmount()));
        }

        Payment savedPayment = paymentRepository.save(payment);
        saleRepository.save(sale);

        auditLogService.log(AuditAction.CREATE, AuditEntityType.PAYMENT, savedPayment.getId(),
                "Received " + paymentAmount + " for sale " + sale.getInvoiceNumber());
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.SALE, sale.getId(), sale.getInvoiceNumber());

        SaleResponse response = SaleResponse.from(sale);
        response.setPayments(loadPayments(subscriberId, saleId));
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

    private List<SalePaymentResponse> loadPayments(Long subscriberId, Long saleId) {
        return paymentRepository.findBySale(subscriberId, ReferenceType.SALE, saleId, PaymentType.RECEIVED).stream()
                .map(SalePaymentResponse::from)
                .toList();
    }

    private String suggestNextInvoiceNumber(Long subscriberId) {
        return saleRepository.findFirstBySubscriber_IdOrderByIdDesc(subscriberId)
                .map(Sale::getInvoiceNumber)
                .map(InvoiceNumberGenerator::suggestNext)
                .orElseGet(InvoiceNumberGenerator::defaultFirst);
    }

    private String resolveInvoiceNumber(Long subscriberId, String requestedInvoiceNumber) {
        String trimmed = normalizeOptional(requestedInvoiceNumber);
        if (trimmed != null) {
            return trimmed;
        }
        return suggestNextInvoiceNumber(subscriberId);
    }

    private Sale getOwnedSale(Long subscriberId, Long saleId) {
        return saleRepository.findByIdAndSubscriberId(saleId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found"));
    }

    private void attachBuiltItems(Sale sale, List<BuiltSaleItem> builtItems) {
        for (BuiltSaleItem builtItem : builtItems) {
            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setProduct(builtItem.product());
            saleItem.setDescription(builtItem.product().getName());
            saleItem.setQuantity(builtItem.quantity());
            saleItem.setUnitPrice(builtItem.product().getSellingPrice());
            saleItem.setAmount(builtItem.lineAmount());
            sale.getItems().add(saleItem);
        }
    }

    private List<BuiltSaleItem> buildSaleItems(Long subscriberId, List<CreateSaleItemRequest> items) {
        return buildSaleItems(subscriberId, items, Set.of());
    }

    private List<BuiltSaleItem> buildSaleItems(Long subscriberId,
                                               List<CreateSaleItemRequest> items,
                                               Set<Long> allowedInactiveProductIds) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }

        List<BuiltSaleItem> builtItems = new ArrayList<>();
        for (CreateSaleItemRequest itemRequest : items) {
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

            builtItems.add(new BuiltSaleItem(product, quantity, lineGross, lineDiscount, lineAmount));
        }
        return builtItems;
    }

    private List<SaleItemResponse> mapSaleItems(Sale sale) {
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            return List.of();
        }
        return sale.getItems().stream().map(SaleItemResponse::from).toList();
    }

    private AmountBreakdown calculateAmounts(CreateSaleRequest request, List<BuiltSaleItem> builtItems) {
        BigDecimal grossAmount;
        BigDecimal discountAmount;

        if (!builtItems.isEmpty()) {
            grossAmount = builtItems.stream()
                    .map(BuiltSaleItem::lineGross)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            discountAmount = builtItems.stream()
                    .map(BuiltSaleItem::lineDiscount)
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

    private record BuiltSaleItem(
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
