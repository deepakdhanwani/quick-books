package com.quickbooks.dto.reminder;

import com.quickbooks.entity.PaymentReminder;
import com.quickbooks.entity.enums.PaymentReminderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class PaymentReminderResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long saleId;
    private String invoiceNumber;
    private BigDecimal amount;
    private LocalDate promisedDate;
    private String notes;
    private PaymentReminderStatus status;
    private LocalDate snoozedUntil;
    private LocalDate effectiveDueDate;
    private boolean overdue;
    private boolean dueToday;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static PaymentReminderResponse from(PaymentReminder reminder, LocalDate referenceDate) {
        PaymentReminderResponse response = new PaymentReminderResponse();
        response.setId(reminder.getId());
        response.setCustomerId(reminder.getCustomer().getId());
        response.setCustomerName(reminder.getCustomer().getName());
        if (reminder.getSale() != null) {
            response.setSaleId(reminder.getSale().getId());
            response.setInvoiceNumber(reminder.getSale().getInvoiceNumber());
        }
        response.setAmount(reminder.getAmount());
        response.setPromisedDate(reminder.getPromisedDate());
        response.setNotes(reminder.getNotes());
        response.setStatus(reminder.getStatus());
        response.setSnoozedUntil(reminder.getSnoozedUntil());
        LocalDate effectiveDueDate = resolveEffectiveDueDate(reminder);
        response.setEffectiveDueDate(effectiveDueDate);
        boolean active = reminder.getStatus() == PaymentReminderStatus.PENDING
                || reminder.getStatus() == PaymentReminderStatus.SNOOZED;
        response.setDueToday(active && effectiveDueDate.isEqual(referenceDate));
        response.setOverdue(active && effectiveDueDate.isBefore(referenceDate));
        response.setCreatedAt(reminder.getCreatedAt());
        response.setUpdatedAt(reminder.getUpdatedAt());
        return response;
    }

    public static LocalDate resolveEffectiveDueDate(PaymentReminder reminder) {
        if (reminder.getStatus() == PaymentReminderStatus.SNOOZED && reminder.getSnoozedUntil() != null) {
            return reminder.getSnoozedUntil();
        }
        return reminder.getPromisedDate();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public Long getSaleId() { return saleId; }
    public void setSaleId(Long saleId) { this.saleId = saleId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getPromisedDate() { return promisedDate; }
    public void setPromisedDate(LocalDate promisedDate) { this.promisedDate = promisedDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public PaymentReminderStatus getStatus() { return status; }
    public void setStatus(PaymentReminderStatus status) { this.status = status; }
    public LocalDate getSnoozedUntil() { return snoozedUntil; }
    public void setSnoozedUntil(LocalDate snoozedUntil) { this.snoozedUntil = snoozedUntil; }
    public LocalDate getEffectiveDueDate() { return effectiveDueDate; }
    public void setEffectiveDueDate(LocalDate effectiveDueDate) { this.effectiveDueDate = effectiveDueDate; }
    public boolean isOverdue() { return overdue; }
    public void setOverdue(boolean overdue) { this.overdue = overdue; }
    public boolean isDueToday() { return dueToday; }
    public void setDueToday(boolean dueToday) { this.dueToday = dueToday; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
