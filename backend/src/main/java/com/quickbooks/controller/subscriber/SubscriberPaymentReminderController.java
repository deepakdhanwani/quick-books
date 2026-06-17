package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.reminder.CreatePaymentReminderRequest;
import com.quickbooks.dto.reminder.PaymentReminderResponse;
import com.quickbooks.dto.reminder.SnoozePaymentReminderRequest;
import com.quickbooks.dto.reminder.UpdatePaymentReminderRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.PaymentReminderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriber/payment-reminders")
public class SubscriberPaymentReminderController {

    private final PaymentReminderService paymentReminderService;

    public SubscriberPaymentReminderController(PaymentReminderService paymentReminderService) {
        this.paymentReminderService = paymentReminderService;
    }

    @GetMapping
    public PageResponse<PaymentReminderResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "active") String timeFilter) {
        return paymentReminderService.findPage(principal.getId(), page, size, timeFilter);
    }

    @GetMapping("/due")
    public List<PaymentReminderResponse> due(@AuthenticationPrincipal UserPrincipal principal) {
        return paymentReminderService.findDueSummary(principal.getId());
    }

    @GetMapping("/{id}")
    public PaymentReminderResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id) {
        return paymentReminderService.getById(principal.getId(), id);
    }

    @PostMapping
    public PaymentReminderResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody CreatePaymentReminderRequest request) {
        return paymentReminderService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public PaymentReminderResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id,
                                          @Valid @RequestBody UpdatePaymentReminderRequest request) {
        return paymentReminderService.update(principal.getId(), id, request);
    }

    @PatchMapping("/{id}/snooze")
    public PaymentReminderResponse snooze(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id,
                                          @Valid @RequestBody SnoozePaymentReminderRequest request) {
        return paymentReminderService.snooze(principal.getId(), id, request);
    }

    @PatchMapping("/{id}/complete")
    public PaymentReminderResponse complete(@AuthenticationPrincipal UserPrincipal principal,
                                            @PathVariable Long id) {
        return paymentReminderService.complete(principal.getId(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        paymentReminderService.delete(principal.getId(), id);
    }
}
