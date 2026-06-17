package com.quickbooks.dto.reminder;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class SnoozePaymentReminderRequest {

    @NotNull
    private LocalDate snoozedUntil;

    public LocalDate getSnoozedUntil() { return snoozedUntil; }
    public void setSnoozedUntil(LocalDate snoozedUntil) { this.snoozedUntil = snoozedUntil; }
}
