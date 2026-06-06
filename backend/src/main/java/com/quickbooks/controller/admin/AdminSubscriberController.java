package com.quickbooks.controller.admin;

import com.quickbooks.dto.subscriber.CreateSubscriberRequest;
import com.quickbooks.dto.subscriber.SubscriberResponse;
import com.quickbooks.service.SubscriberService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subscribers")
public class AdminSubscriberController {

    private final SubscriberService subscriberService;

    public AdminSubscriberController(SubscriberService subscriberService) {
        this.subscriberService = subscriberService;
    }

    @GetMapping
    public List<SubscriberResponse> list() {
        return subscriberService.findAll();
    }

    @PostMapping
    public SubscriberResponse create(@Valid @RequestBody CreateSubscriberRequest request) {
        return subscriberService.create(request);
    }
}
