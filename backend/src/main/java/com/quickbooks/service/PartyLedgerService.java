package com.quickbooks.service;

import com.quickbooks.dto.ledger.PartyLedgerEntryResponse;
import com.quickbooks.dto.ledger.PartyLedgerPageResponse;
import com.quickbooks.dto.ledger.PartyLedgerSummaryResponse;
import com.quickbooks.entity.Customer;
import com.quickbooks.entity.Payment;
import com.quickbooks.entity.Purchase;
import com.quickbooks.entity.Sale;
import com.quickbooks.entity.Vendor;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.PaymentRepository;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleRepository;
import com.quickbooks.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PartyLedgerService {

    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;
    private final PaymentRepository paymentRepository;

    public PartyLedgerService(CustomerRepository customerRepository,
                              VendorRepository vendorRepository,
                              SaleRepository saleRepository,
                              PurchaseRepository purchaseRepository,
                              PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.vendorRepository = vendorRepository;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public PartyLedgerSummaryResponse getCustomerAccountSummary(Long subscriberId, Long customerId) {
        Customer customer = getCustomer(subscriberId, customerId);
        return buildCustomerSummary(customer, subscriberId, customerId);
    }

    @Transactional(readOnly = true)
    public PartyLedgerSummaryResponse getVendorAccountSummary(Long subscriberId, Long vendorId) {
        Vendor vendor = getVendor(subscriberId, vendorId);
        return buildVendorSummary(vendor, subscriberId, vendorId);
    }

    @Transactional(readOnly = true)
    public PartyLedgerPageResponse getCustomerLedger(Long subscriberId,
                                                   Long customerId,
                                                   int page,
                                                   int size,
                                                   LocalDate fromDate,
                                                   LocalDate toDate) {
        Customer customer = getCustomer(subscriberId, customerId);
        List<PartyLedgerEntryResponse> displayEntries = buildCustomerLedgerEntries(
                customer, subscriberId, customerId, fromDate, toDate);
        PartyLedgerSummaryResponse summary = buildCustomerSummary(customer, subscriberId, customerId);
        return paginate(displayEntries, page, size, summary);
    }

    @Transactional(readOnly = true)
    public PartyLedgerPageResponse getVendorLedger(Long subscriberId,
                                                   Long vendorId,
                                                   int page,
                                                   int size,
                                                   LocalDate fromDate,
                                                   LocalDate toDate) {
        Vendor vendor = getVendor(subscriberId, vendorId);
        List<PartyLedgerEntryResponse> displayEntries = buildVendorLedgerEntries(
                vendor, subscriberId, vendorId, fromDate, toDate);
        PartyLedgerSummaryResponse summary = buildVendorSummary(vendor, subscriberId, vendorId);
        return paginate(displayEntries, page, size, summary);
    }

    private List<PartyLedgerEntryResponse> buildCustomerLedgerEntries(Customer customer,
                                                                      Long subscriberId,
                                                                      Long customerId,
                                                                      LocalDate fromDate,
                                                                      LocalDate toDate) {
        List<Sale> sales = saleRepository.findAllBySubscriberAndCustomer(subscriberId, customerId);
        List<Long> saleIds = sales.stream().map(Sale::getId).toList();
        List<Payment> payments = saleIds.isEmpty()
                ? List.of()
                : paymentRepository.findReceivedBySaleIds(subscriberId, saleIds);

        Map<Long, List<Payment>> paymentsBySale = payments.stream()
                .collect(Collectors.groupingBy(Payment::getReferenceId));

        List<PartyLedgerEntryResponse> entries = new ArrayList<>();
        for (Sale sale : sales) {
            entries.add(toCustomerInvoiceEntry(sale));
            List<Payment> salePayments = new ArrayList<>(
                    paymentsBySale.getOrDefault(sale.getId(), List.of()));
            salePayments.sort(Comparator.comparing(Payment::getDate).thenComparing(Payment::getId));
            for (Payment payment : salePayments) {
                entries.add(toCustomerPaymentEntry(sale, payment));
            }
        }

        entries = filterEntriesByDate(entries, fromDate, toDate);
        return finalizeCustomerEntries(entries, customer);
    }

    private List<PartyLedgerEntryResponse> buildVendorLedgerEntries(Vendor vendor,
                                                                    Long subscriberId,
                                                                    Long vendorId,
                                                                    LocalDate fromDate,
                                                                    LocalDate toDate) {
        List<Purchase> purchases = purchaseRepository.findAllBySubscriberAndVendor(subscriberId, vendorId);
        List<Long> purchaseIds = purchases.stream().map(Purchase::getId).toList();
        List<Payment> payments = purchaseIds.isEmpty()
                ? List.of()
                : paymentRepository.findPaidByPurchaseIds(subscriberId, purchaseIds);

        Map<Long, List<Payment>> paymentsByPurchase = payments.stream()
                .collect(Collectors.groupingBy(Payment::getReferenceId));

        List<PartyLedgerEntryResponse> entries = new ArrayList<>();
        for (Purchase purchase : purchases) {
            entries.add(toVendorBillEntry(purchase));
            List<Payment> purchasePayments = new ArrayList<>(
                    paymentsByPurchase.getOrDefault(purchase.getId(), List.of()));
            purchasePayments.sort(Comparator.comparing(Payment::getDate).thenComparing(Payment::getId));
            for (Payment payment : purchasePayments) {
                entries.add(toVendorPaymentEntry(purchase, payment));
            }
        }

        entries = filterEntriesByDate(entries, fromDate, toDate);
        return finalizeVendorEntries(entries, vendor);
    }

    private List<PartyLedgerEntryResponse> filterEntriesByDate(List<PartyLedgerEntryResponse> entries,
                                                             LocalDate fromDate,
                                                             LocalDate toDate) {
        if (fromDate == null && toDate == null) {
            return entries;
        }
        return entries.stream()
                .filter(entry -> {
                    LocalDate entryDate = entry.getDate();
                    if (fromDate != null && entryDate.isBefore(fromDate)) {
                        return false;
                    }
                    if (toDate != null && entryDate.isAfter(toDate)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private PartyLedgerSummaryResponse buildCustomerSummary(Customer customer,
                                                            Long subscriberId,
                                                            Long customerId) {
        OpeningBalanceSupport.OpeningSplit opening = OpeningBalanceSupport.customerOpening(
                customer.getOpeningBalance(),
                customer.getOpeningBalanceNature());

        BigDecimal totalDebit = nullToZero(saleRepository.sumTotalAmountByCustomer(subscriberId, customerId))
                .add(opening.debit());
        Object[] paymentAgg = firstAggregateRow(
                paymentRepository.aggregateReceivedByCustomer(subscriberId, customerId));
        BigDecimal cashCredit = toBigDecimal(paymentAgg[0]);
        BigDecimal totalAdjusted = toBigDecimal(paymentAgg[1]);
        long paymentCount = paymentAgg[2] instanceof Number number ? number.longValue() : 0L;
        BigDecimal totalCredit = cashCredit.add(totalAdjusted).add(opening.credit());
        BigDecimal closingBalance = nullToZero(saleRepository.sumPendingAmountByCustomer(subscriberId, customerId))
                .add(OpeningBalanceSupport.customerNetBalance(opening));
        long invoiceCount = saleRepository.countBySubscriberAndCustomer(subscriberId, customerId);
        long openingEntries = hasOpening(opening) ? 1L : 0L;

        PartyLedgerSummaryResponse summary = new PartyLedgerSummaryResponse();
        summary.setTotalDebit(scale(totalDebit));
        summary.setTotalCredit(scale(totalCredit));
        summary.setTotalAdjusted(scale(totalAdjusted));
        summary.setClosingBalance(scale(closingBalance));
        summary.setOpeningDebit(scale(opening.debit()));
        summary.setOpeningCredit(scale(opening.credit()));
        summary.setOpeningBalance(scale(OpeningBalanceSupport.customerNetBalance(opening)));
        summary.setEntryCount(invoiceCount + paymentCount + openingEntries);
        return summary;
    }

    private PartyLedgerSummaryResponse buildVendorSummary(Vendor vendor,
                                                          Long subscriberId,
                                                          Long vendorId) {
        OpeningBalanceSupport.OpeningSplit opening = OpeningBalanceSupport.vendorOpening(
                vendor.getOpeningBalance(),
                vendor.getOpeningBalanceNature());

        BigDecimal totalCredit = nullToZero(purchaseRepository.sumTotalAmountByVendor(subscriberId, vendorId))
                .add(opening.credit());
        Object[] paymentAgg = firstAggregateRow(
                paymentRepository.aggregatePaidByVendor(subscriberId, vendorId));
        BigDecimal cashDebit = toBigDecimal(paymentAgg[0]);
        BigDecimal totalAdjusted = toBigDecimal(paymentAgg[1]);
        long paymentCount = paymentAgg[2] instanceof Number number ? number.longValue() : 0L;
        BigDecimal totalDebit = cashDebit.add(totalAdjusted).add(opening.debit());
        BigDecimal closingBalance = nullToZero(purchaseRepository.sumPendingAmountByVendor(subscriberId, vendorId))
                .add(OpeningBalanceSupport.vendorNetBalance(opening));
        long billCount = purchaseRepository.countBySubscriberAndVendor(subscriberId, vendorId);
        long openingEntries = hasOpening(opening) ? 1L : 0L;

        PartyLedgerSummaryResponse summary = new PartyLedgerSummaryResponse();
        summary.setTotalDebit(scale(totalDebit));
        summary.setTotalCredit(scale(totalCredit));
        summary.setTotalAdjusted(scale(totalAdjusted));
        summary.setClosingBalance(scale(closingBalance));
        summary.setOpeningDebit(scale(opening.debit()));
        summary.setOpeningCredit(scale(opening.credit()));
        summary.setOpeningBalance(scale(OpeningBalanceSupport.vendorNetBalance(opening)));
        summary.setEntryCount(billCount + paymentCount + openingEntries);
        return summary;
    }

    private List<PartyLedgerEntryResponse> finalizeCustomerEntries(List<PartyLedgerEntryResponse> entries,
                                                                   Customer customer) {
        entries.sort(Comparator
                .comparing(PartyLedgerEntryResponse::getDate)
                .thenComparing(entry -> kindOrder(entry.getKind()))
                .thenComparing(PartyLedgerEntryResponse::getId));

        OpeningBalanceSupport.OpeningSplit opening = OpeningBalanceSupport.customerOpening(
                customer.getOpeningBalance(),
                customer.getOpeningBalanceNature());
        BigDecimal balance = OpeningBalanceSupport.customerNetBalance(opening);
        for (PartyLedgerEntryResponse entry : entries) {
            balance = balance.add(nullToZero(entry.getDebit())).subtract(nullToZero(entry.getCredit()));
            entry.setBalance(scale(balance));
        }

        List<PartyLedgerEntryResponse> reversed = new ArrayList<>(entries);
        java.util.Collections.reverse(reversed);
        return reversed;
    }

    private List<PartyLedgerEntryResponse> finalizeVendorEntries(List<PartyLedgerEntryResponse> entries,
                                                                 Vendor vendor) {
        entries.sort(Comparator
                .comparing(PartyLedgerEntryResponse::getDate)
                .thenComparing(entry -> kindOrder(entry.getKind()))
                .thenComparing(PartyLedgerEntryResponse::getId));

        OpeningBalanceSupport.OpeningSplit opening = OpeningBalanceSupport.vendorOpening(
                vendor.getOpeningBalance(),
                vendor.getOpeningBalanceNature());
        BigDecimal balance = OpeningBalanceSupport.vendorNetBalance(opening);
        for (PartyLedgerEntryResponse entry : entries) {
            balance = balance.add(nullToZero(entry.getCredit())).subtract(nullToZero(entry.getDebit()));
            entry.setBalance(scale(balance));
        }

        List<PartyLedgerEntryResponse> reversed = new ArrayList<>(entries);
        java.util.Collections.reverse(reversed);
        return reversed;
    }

    private PartyLedgerEntryResponse toCustomerInvoiceEntry(Sale sale) {
        String invoiceRef = sale.getInvoiceNumber() != null ? sale.getInvoiceNumber() : "Sale #" + sale.getId();
        PartyLedgerEntryResponse entry = new PartyLedgerEntryResponse();
        entry.setId("sale-" + sale.getId());
        entry.setDate(sale.getDate());
        entry.setKind("INVOICE");
        entry.setReferenceId(sale.getId());
        entry.setReferenceLabel(invoiceRef);
        entry.setParticulars("Invoice " + invoiceRef);
        entry.setDebit(scale(sale.getTotalAmount()));
        entry.setCredit(BigDecimal.ZERO);
        return entry;
    }

    private PartyLedgerEntryResponse toCustomerPaymentEntry(Sale sale, Payment payment) {
        String invoiceRef = sale.getInvoiceNumber() != null ? sale.getInvoiceNumber() : "Sale #" + sale.getId();
        BigDecimal adjusted = nullToZero(payment.getAdjustedAmount());
        BigDecimal credit = nullToZero(payment.getAmount()).add(adjusted);
        String particulars = "Payment received · " + invoiceRef;
        if (adjusted.compareTo(BigDecimal.ZERO) > 0) {
            particulars += " (incl. " + formatAmount(adjusted) + " adjusted)";
        }

        PartyLedgerEntryResponse entry = new PartyLedgerEntryResponse();
        entry.setId("sale-payment-" + payment.getId());
        entry.setDate(payment.getDate());
        entry.setKind("PAYMENT_IN");
        entry.setReferenceId(sale.getId());
        entry.setReferenceLabel(invoiceRef);
        entry.setParticulars(particulars);
        entry.setDebit(BigDecimal.ZERO);
        entry.setCredit(scale(credit));
        return entry;
    }

    private PartyLedgerEntryResponse toVendorBillEntry(Purchase purchase) {
        String billRef = purchase.getBillNumber() != null ? purchase.getBillNumber() : "Bill #" + purchase.getId();
        PartyLedgerEntryResponse entry = new PartyLedgerEntryResponse();
        entry.setId("purchase-" + purchase.getId());
        entry.setDate(purchase.getDate());
        entry.setKind("BILL");
        entry.setReferenceId(purchase.getId());
        entry.setReferenceLabel(billRef);
        entry.setParticulars("Bill " + billRef);
        entry.setDebit(BigDecimal.ZERO);
        entry.setCredit(scale(purchase.getTotalAmount()));
        return entry;
    }

    private PartyLedgerEntryResponse toVendorPaymentEntry(Purchase purchase, Payment payment) {
        String billRef = purchase.getBillNumber() != null ? purchase.getBillNumber() : "Bill #" + purchase.getId();
        BigDecimal adjusted = nullToZero(payment.getAdjustedAmount());
        BigDecimal debit = nullToZero(payment.getAmount()).add(adjusted);
        String particulars = "Payment made · " + billRef;
        if (adjusted.compareTo(BigDecimal.ZERO) > 0) {
            particulars += " (incl. " + formatAmount(adjusted) + " adjusted)";
        }

        PartyLedgerEntryResponse entry = new PartyLedgerEntryResponse();
        entry.setId("purchase-payment-" + payment.getId());
        entry.setDate(payment.getDate());
        entry.setKind("PAYMENT_OUT");
        entry.setReferenceId(purchase.getId());
        entry.setReferenceLabel(billRef);
        entry.setParticulars(particulars);
        entry.setDebit(scale(debit));
        entry.setCredit(BigDecimal.ZERO);
        return entry;
    }

    private PartyLedgerPageResponse paginate(List<PartyLedgerEntryResponse> entries,
                                             int page,
                                             int size,
                                             PartyLedgerSummaryResponse summary) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        int totalElements = entries.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);
        int fromIndex = Math.min(normalizedPage * normalizedSize, totalElements);
        int toIndex = Math.min(fromIndex + normalizedSize, totalElements);

        PartyLedgerPageResponse response = new PartyLedgerPageResponse();
        response.setSummary(summary);
        response.setContent(entries.subList(fromIndex, toIndex));
        response.setPage(normalizedPage);
        response.setSize(normalizedSize);
        response.setTotalElements(totalElements);
        response.setTotalPages(totalPages);
        return response;
    }

    private int kindOrder(String kind) {
        return switch (kind) {
            case "INVOICE", "BILL" -> 0;
            default -> 1;
        };
    }

    private Customer getCustomer(Long subscriberId, Long customerId) {
        return customerRepository.findByIdAndSubscriberId(customerId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    private Vendor getVendor(Long subscriberId, Long vendorId) {
        return vendorRepository.findByIdAndSubscriberId(vendorId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
    }

    private boolean hasOpening(OpeningBalanceSupport.OpeningSplit opening) {
        return opening.debit().compareTo(BigDecimal.ZERO) > 0
                || opening.credit().compareTo(BigDecimal.ZERO) > 0;
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private Object[] firstAggregateRow(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return new Object[] { BigDecimal.ZERO, BigDecimal.ZERO, 0L };
        }
        Object[] row = rows.get(0);
        if (row.length == 1 && row[0] instanceof Object[] nested) {
            return nested;
        }
        return row;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal scale(BigDecimal value) {
        return nullToZero(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String formatAmount(BigDecimal value) {
        return "₹" + scale(value).stripTrailingZeros().toPlainString();
    }
}
