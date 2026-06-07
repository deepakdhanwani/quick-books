package com.quickbooks.dto.purchase;

import com.quickbooks.entity.Purchase;
import com.quickbooks.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class PurchaseResponse {

    private Long id;
    private Long vendorId;
    private String vendorName;
    private String billNumber;
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
    private List<PurchaseItemResponse> items;
    private List<PurchasePaymentResponse> payments;

    public static PurchaseResponse from(Purchase purchase) {
        PurchaseResponse response = new PurchaseResponse();
        response.setId(purchase.getId());
        response.setVendorId(purchase.getVendor().getId());
        response.setVendorName(purchase.getVendor().getName());
        response.setBillNumber(purchase.getBillNumber());
        response.setDate(purchase.getDate());
        response.setGrossAmount(purchase.getGrossAmount());
        response.setDiscountAmount(purchase.getDiscountAmount());
        response.setTaxPercent(purchase.getTaxPercent());
        response.setTaxAmount(purchase.getTaxAmount());
        response.setNetAmount(purchase.getTotalAmount());
        response.setPaidAmount(purchase.getPaidAmount());
        response.setPendingAmount(purchase.getPendingAmount());
        response.setAdjustedAmount(purchase.getAdjustedAmount());
        response.setPaymentStatus(purchase.getPaymentStatus());
        response.setNotes(purchase.getNotes());
        response.setCreatedAt(purchase.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getBillNumber() { return billNumber; }
    public void setBillNumber(String billNumber) { this.billNumber = billNumber; }
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
    public List<PurchaseItemResponse> getItems() { return items; }
    public void setItems(List<PurchaseItemResponse> items) { this.items = items; }
    public List<PurchasePaymentResponse> getPayments() { return payments; }
    public void setPayments(List<PurchasePaymentResponse> payments) { this.payments = payments; }
}
