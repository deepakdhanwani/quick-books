package com.quickbooks.controller.admin;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.plan.CreateSubscriptionPlanRequest;
import com.quickbooks.dto.plan.SubscriptionPlanResponse;
import com.quickbooks.dto.plan.UpdateSubscriptionPlanRequest;
import com.quickbooks.service.SubscriptionPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subscription-plans")
public class AdminSubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    public AdminSubscriptionPlanController(SubscriptionPlanService subscriptionPlanService) {
        this.subscriptionPlanService = subscriptionPlanService;
    }

    @GetMapping
    public PageResponse<SubscriptionPlanResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return subscriptionPlanService.findPage(page, size);
    }

    @GetMapping("/active")
    public List<SubscriptionPlanResponse> listActive() {
        return subscriptionPlanService.findActive();
    }

    @PostMapping
    public SubscriptionPlanResponse create(@Valid @RequestBody CreateSubscriptionPlanRequest request) {
        return subscriptionPlanService.create(request);
    }

    @PutMapping("/{id}")
    public SubscriptionPlanResponse update(@PathVariable Long id,
                                           @Valid @RequestBody UpdateSubscriptionPlanRequest request) {
        return subscriptionPlanService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        subscriptionPlanService.delete(id);
    }
}
