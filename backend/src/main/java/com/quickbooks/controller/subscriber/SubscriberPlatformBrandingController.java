package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.platform.PlatformBrandingResponse;
import com.quickbooks.service.PlatformSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscriber/platform-branding")
public class SubscriberPlatformBrandingController {

    private final PlatformSettingsService platformSettingsService;

    public SubscriberPlatformBrandingController(PlatformSettingsService platformSettingsService) {
        this.platformSettingsService = platformSettingsService;
    }

    @GetMapping
    public PlatformBrandingResponse branding() {
        return platformSettingsService.getBranding();
    }
}
