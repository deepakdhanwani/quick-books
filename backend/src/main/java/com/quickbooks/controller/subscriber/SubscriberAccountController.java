package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.subscriber.ChangeSubscriberPinRequest;
import com.quickbooks.dto.subscriber.SubscriberAccountProfileResponse;
import com.quickbooks.dto.subscriber.UpdateSubscriberAccountSettingsRequest;
import com.quickbooks.dto.subscriber.UpdateUserPreferencesRequest;
import com.quickbooks.dto.subscriber.UserPreferencesResponse;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.AuditLogService;
import com.quickbooks.service.SubscriberService;
import com.quickbooks.service.UserPreferencesService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriber/account")
public class SubscriberAccountController {

    private final SubscriberService subscriberService;
    private final UserPreferencesService userPreferencesService;

    public SubscriberAccountController(SubscriberService subscriberService,
                                       UserPreferencesService userPreferencesService) {
        this.subscriberService = subscriberService;
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping("/profile")
    public SubscriberAccountProfileResponse profile(@AuthenticationPrincipal UserPrincipal principal) {
        return subscriberService.getAccountProfile(principal.getSubscriberId(), principal);
    }

    @PutMapping("/settings")
    public SubscriberAccountProfileResponse updateSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateSubscriberAccountSettingsRequest request) {
        AuditLogService.requireOwner(principal);
        return subscriberService.updateAccountSettings(principal.getSubscriberId(), request);
    }

    @PostMapping("/change-pin")
    public Map<String, String> changePin(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody ChangeSubscriberPinRequest request) {
        subscriberService.changeLoginPin(principal.getSubscriberId(), request, principal);
        return Map.of("message", "Login PIN updated successfully");
    }

    @GetMapping("/preferences")
    public UserPreferencesResponse preferences(@AuthenticationPrincipal UserPrincipal principal) {
        return userPreferencesService.getPreferences(principal);
    }

    @PutMapping("/preferences")
    public UserPreferencesResponse updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserPreferencesRequest request) {
        return userPreferencesService.updatePreferences(principal, request);
    }
}
