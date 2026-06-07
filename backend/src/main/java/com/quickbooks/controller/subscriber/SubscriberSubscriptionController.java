package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.subscriber.SubscribeRequest;
import com.quickbooks.dto.subscriber.SubscribeResponse;
import com.quickbooks.dto.subscriber.SubscriberPlanOptionResponse;
import com.quickbooks.dto.subscriber.SubscriberSubscriptionInfo;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.AuditLogService;
import com.quickbooks.service.SubscriberSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriber")
public class SubscriberSubscriptionController {

    private final SubscriberSubscriptionService subscriberSubscriptionService;

    public SubscriberSubscriptionController(SubscriberSubscriptionService subscriberSubscriptionService) {
        this.subscriberSubscriptionService = subscriberSubscriptionService;
    }

    @GetMapping("/subscription-plans")
    public List<SubscriberPlanOptionResponse> listPlans(@AuthenticationPrincipal UserPrincipal principal) {
        return subscriberSubscriptionService.listAvailablePlans(principal.getId());
    }

    @GetMapping("/subscriptions/current")
    public ResponseEntity<SubscriberSubscriptionInfo> getCurrent(@AuthenticationPrincipal UserPrincipal principal) {
        SubscriberSubscriptionInfo current = subscriberSubscriptionService.getCurrentSubscription(principal.getId());
        if (current == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(current);
    }

    @PostMapping("/subscriptions")
    public SubscribeResponse subscribe(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody SubscribeRequest request) {
        AuditLogService.requireOwner(principal);
        return subscriberSubscriptionService.subscribe(principal.getId(), request);
    }
}
