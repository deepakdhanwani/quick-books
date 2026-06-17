package com.quickbooks.controller.admin;

import com.quickbooks.dto.platform.PlatformCompanySettingsResponse;
import com.quickbooks.dto.platform.PlatformSettingsResponse;
import com.quickbooks.dto.platform.SmtpSettingsResponse;
import com.quickbooks.dto.platform.UpdatePlatformCompanySettingsRequest;
import com.quickbooks.dto.platform.UpdateSmtpSettingsRequest;
import com.quickbooks.service.PlatformSettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/platform-settings")
public class AdminPlatformSettingsController {

    private final PlatformSettingsService platformSettingsService;

    public AdminPlatformSettingsController(PlatformSettingsService platformSettingsService) {
        this.platformSettingsService = platformSettingsService;
    }

    @GetMapping
    public PlatformSettingsResponse getSettings() {
        return platformSettingsService.getSettings();
    }

    @PutMapping("/company")
    public PlatformCompanySettingsResponse updateCompanySettings(
            @Valid @RequestBody UpdatePlatformCompanySettingsRequest request) {
        return platformSettingsService.updateCompanySettings(request);
    }

    @PutMapping("/smtp")
    public SmtpSettingsResponse updateSmtpSettings(@Valid @RequestBody UpdateSmtpSettingsRequest request) {
        return platformSettingsService.updateSmtpSettings(request);
    }
}
