package com.quickbooks.controller.admin;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.subscriber.CreateSubscriberRequest;
import com.quickbooks.dto.subscriber.SubscriberDetailResponse;
import com.quickbooks.dto.subscriber.SubscriberResponse;
import com.quickbooks.dto.subscriber.UpdateSubscriberRequest;
import com.quickbooks.service.SubscriberService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/subscribers")
public class AdminSubscriberController {

    private final SubscriberService subscriberService;

    public AdminSubscriberController(SubscriberService subscriberService) {
        this.subscriberService = subscriberService;
    }

    @GetMapping
    public PageResponse<SubscriberResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return subscriberService.findPage(page, size);
    }

    @GetMapping("/{id}")
    public SubscriberDetailResponse get(@PathVariable Long id) {
        return subscriberService.getDetail(id);
    }

    @PostMapping
    public SubscriberResponse create(@Valid @RequestBody CreateSubscriberRequest request) {
        return subscriberService.create(request);
    }

    @PutMapping("/{id}")
    public SubscriberResponse update(@PathVariable Long id,
                                     @Valid @RequestBody UpdateSubscriberRequest request) {
        return subscriberService.update(id, request);
    }

    @PostMapping("/{id}/reset-pin")
    public SubscriberResponse resetPin(@PathVariable Long id) {
        return subscriberService.resetLoginPin(id);
    }
}
