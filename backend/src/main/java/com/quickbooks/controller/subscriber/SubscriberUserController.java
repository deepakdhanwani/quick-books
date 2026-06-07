package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.subscriberuser.CreateSubscriberUserRequest;
import com.quickbooks.dto.subscriberuser.SetSubscriberUserPinRequest;
import com.quickbooks.dto.subscriberuser.SubscriberUserResponse;
import com.quickbooks.dto.subscriberuser.UpdateSubscriberUserRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.AuditLogService;
import com.quickbooks.service.SubscriberUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriber/users")
public class SubscriberUserController {

    private final SubscriberUserService subscriberUserService;

    public SubscriberUserController(SubscriberUserService subscriberUserService) {
        this.subscriberUserService = subscriberUserService;
    }

    @GetMapping
    public List<SubscriberUserResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        AuditLogService.requireOwner(principal);
        return subscriberUserService.list(principal.getSubscriberId());
    }

    @GetMapping("/{id}")
    public SubscriberUserResponse getById(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable Long id) {
        AuditLogService.requireOwner(principal);
        return subscriberUserService.getById(principal.getSubscriberId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriberUserResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody CreateSubscriberUserRequest request) {
        AuditLogService.requireOwner(principal);
        return subscriberUserService.create(principal.getSubscriberId(), request);
    }

    @PutMapping("/{id}")
    public SubscriberUserResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id,
                                         @Valid @RequestBody UpdateSubscriberUserRequest request) {
        AuditLogService.requireOwner(principal);
        return subscriberUserService.update(principal.getSubscriberId(), id, request);
    }

    @PostMapping("/{id}/set-pin")
    public SubscriberUserResponse setPin(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id,
                                         @Valid @RequestBody SetSubscriberUserPinRequest request) {
        AuditLogService.requireOwner(principal);
        return subscriberUserService.setLoginPin(principal.getSubscriberId(), id, request.getLoginPin());
    }

    @PostMapping("/{id}/reset-pin")
    public SubscriberUserResponse resetPin(@AuthenticationPrincipal UserPrincipal principal,
                                           @PathVariable Long id) {
        AuditLogService.requireOwner(principal);
        return subscriberUserService.resetLoginPin(principal.getSubscriberId(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        AuditLogService.requireOwner(principal);
        subscriberUserService.delete(principal.getSubscriberId(), id);
    }
}
