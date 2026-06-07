package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.subscriber.ChangeSubscriberPinRequest;
import com.quickbooks.dto.subscriber.SubscriberAccountProfileResponse;
import com.quickbooks.dto.subscriber.UpdateSubscriberAccountSettingsRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.SubscriberService;
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

    public SubscriberAccountController(SubscriberService subscriberService) {
        this.subscriberService = subscriberService;
    }

    @GetMapping("/profile")
    public SubscriberAccountProfileResponse profile(@AuthenticationPrincipal UserPrincipal principal) {
        return subscriberService.getAccountProfile(principal.getId());
    }

    @PutMapping("/settings")
    public SubscriberAccountProfileResponse updateSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateSubscriberAccountSettingsRequest request) {
        return subscriberService.updateAccountSettings(principal.getId(), request);
    }

    @PostMapping("/change-pin")
    public Map<String, String> changePin(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody ChangeSubscriberPinRequest request) {
        subscriberService.changeLoginPin(principal.getId(), request);
        return Map.of("message", "Login PIN updated successfully");
    }
}
