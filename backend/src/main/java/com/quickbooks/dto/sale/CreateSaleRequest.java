package com.quickbooks.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateSaleRequest {

    @NotNull
    private Long customerId;

    private String invoiceNumber;

    private String invoiceDetails;
    private LocalDate date;

    private BigDecimal grossAmount;

    private BigDecimal discountAmount;
    @Valid
    private List<CreateSaleItemRequest> items;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private String notes;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getInvoiceDetails() { return invoiceDetails; }
    public void setInvoiceDetails(String invoiceDetails) { this.invoiceDetails = invoiceDetails; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public List<CreateSaleItemRequest> getItems() { return items; }
    public void setItems(List<CreateSaleItemRequest> items) { this.items = items; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
