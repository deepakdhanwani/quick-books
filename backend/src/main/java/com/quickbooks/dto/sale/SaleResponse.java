package com.quickbooks.dto.sale;

import com.quickbooks.entity.Sale;
import com.quickbooks.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class SaleResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private String invoiceNumber;
    private String invoiceDetails;
    private LocalDate date;
    private BigDecimal grossAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private BigDecimal adjustedAmount;
    private PaymentStatus paymentStatus;
    private String notes;
    private OffsetDateTime createdAt;
    private List<SaleItemResponse> items;
    private List<SalePaymentResponse> payments;

    public static SaleResponse from(Sale sale) {
        SaleResponse response = new SaleResponse();
        response.setId(sale.getId());
        response.setCustomerId(sale.getCustomer().getId());
        response.setCustomerName(sale.getCustomer().getName());
        response.setInvoiceNumber(sale.getInvoiceNumber());
        response.setInvoiceDetails(sale.getInvoiceDetails());
        response.setDate(sale.getDate());
        response.setGrossAmount(sale.getGrossAmount());
        response.setDiscountAmount(sale.getDiscountAmount());
        response.setTaxPercent(sale.getTaxPercent());
        response.setTaxAmount(sale.getTaxAmount());
        response.setNetAmount(sale.getTotalAmount());
        response.setPaidAmount(sale.getPaidAmount());
        response.setPendingAmount(sale.getPendingAmount());
        response.setAdjustedAmount(sale.getAdjustedAmount());
        response.setPaymentStatus(sale.getPaymentStatus());
        response.setNotes(sale.getNotes());
        response.setCreatedAt(sale.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getInvoiceDetails() { return invoiceDetails; }
    public void setInvoiceDetails(String invoiceDetails) { this.invoiceDetails = invoiceDetails; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public BigDecimal getPendingAmount() { return pendingAmount; }
    public void setPendingAmount(BigDecimal pendingAmount) { this.pendingAmount = pendingAmount; }
    public BigDecimal getAdjustedAmount() { return adjustedAmount; }
    public void setAdjustedAmount(BigDecimal adjustedAmount) { this.adjustedAmount = adjustedAmount; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public List<SaleItemResponse> getItems() { return items; }
    public void setItems(List<SaleItemResponse> items) { this.items = items; }
    public List<SalePaymentResponse> getPayments() { return payments; }
    public void setPayments(List<SalePaymentResponse> payments) { this.payments = payments; }
}
