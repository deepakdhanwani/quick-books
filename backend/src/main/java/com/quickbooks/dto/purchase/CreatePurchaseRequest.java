package com.quickbooks.dto.purchase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreatePurchaseRequest {

    @NotNull
    private Long vendorId;

    private String billNumber;
    private LocalDate date;
    private BigDecimal grossAmount;
    private BigDecimal discountAmount;

    @Valid
    private List<CreatePurchaseItemRequest> items;

    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private String notes;

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getBillNumber() { return billNumber; }
    public void setBillNumber(String billNumber) { this.billNumber = billNumber; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public List<CreatePurchaseItemRequest> getItems() { return items; }
    public void setItems(List<CreatePurchaseItemRequest> items) { this.items = items; }
    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
