package com.quickbooks.dto.reminder;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreatePaymentReminderRequest {

    @NotNull
    private Long customerId;

    private Long saleId;
    private java.math.BigDecimal amount;

    @NotNull
    private LocalDate promisedDate;

    private String notes;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getSaleId() { return saleId; }
    public void setSaleId(Long saleId) { this.saleId = saleId; }
    public java.math.BigDecimal getAmount() { return amount; }
    public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
    public LocalDate getPromisedDate() { return promisedDate; }
    public void setPromisedDate(LocalDate promisedDate) { this.promisedDate = promisedDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
