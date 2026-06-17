package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.reminder.CreatePaymentReminderRequest;
import com.quickbooks.dto.reminder.PaymentReminderResponse;
import com.quickbooks.dto.reminder.SnoozePaymentReminderRequest;
import com.quickbooks.dto.reminder.UpdatePaymentReminderRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.PaymentReminderService;
import com.quickbooks.service.StaffAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriber/payment-reminders")
public class SubscriberPaymentReminderController {

    private final PaymentReminderService paymentReminderService;
    private final StaffAccessService staffAccessService;

    public SubscriberPaymentReminderController(PaymentReminderService paymentReminderService,
                                               StaffAccessService staffAccessService) {
        this.paymentReminderService = paymentReminderService;
        this.staffAccessService = staffAccessService;
    }

    @GetMapping
    public PageResponse<PaymentReminderResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "active") String timeFilter) {
        staffAccessService.requireReminderView(principal);
        return paymentReminderService.findPage(principal.getId(), principal.getCompanyId(), page, size, timeFilter);
    }

    @GetMapping("/due")
    public List<PaymentReminderResponse> due(@AuthenticationPrincipal UserPrincipal principal) {
        staffAccessService.requireViewDashboardReminders(principal);
        return paymentReminderService.findDueSummary(principal.getId(), principal.getCompanyId());
    }

    @GetMapping("/{id}")
    public PaymentReminderResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id) {
        staffAccessService.requireReminderView(principal);
        return paymentReminderService.getById(principal.getId(), principal.getCompanyId(), id);
    }

    @PostMapping
    public PaymentReminderResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody CreatePaymentReminderRequest request) {
        staffAccessService.requireReminderCreate(principal);
        return paymentReminderService.create(principal.getId(), principal.getCompanyId(), request);
    }

    @PutMapping("/{id}")
    public PaymentReminderResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id,
                                          @Valid @RequestBody UpdatePaymentReminderRequest request) {
        staffAccessService.requireReminderEdit(principal);
        return paymentReminderService.update(principal.getId(), principal.getCompanyId(), id, request);
    }

    @PatchMapping("/{id}/snooze")
    public PaymentReminderResponse snooze(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id,
                                          @Valid @RequestBody SnoozePaymentReminderRequest request) {
        staffAccessService.requireReminderEdit(principal);
        return paymentReminderService.snooze(principal.getId(), principal.getCompanyId(), id, request);
    }

    @PatchMapping("/{id}/complete")
    public PaymentReminderResponse complete(@AuthenticationPrincipal UserPrincipal principal,
                                            @PathVariable Long id) {
        staffAccessService.requireReminderEdit(principal);
        return paymentReminderService.complete(principal.getId(), principal.getCompanyId(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        staffAccessService.requireReminderDelete(principal);
        paymentReminderService.delete(principal.getId(), principal.getCompanyId(), id);
    }
}
