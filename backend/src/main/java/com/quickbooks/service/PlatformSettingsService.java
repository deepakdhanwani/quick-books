package com.quickbooks.service;

import com.quickbooks.dto.platform.PlatformCompanySettingsResponse;
import com.quickbooks.dto.platform.PlatformSettingsResponse;
import com.quickbooks.dto.platform.SmtpSettingsResponse;
import com.quickbooks.dto.platform.UpdatePlatformCompanySettingsRequest;
import com.quickbooks.dto.platform.UpdateSmtpSettingsRequest;
import com.quickbooks.entity.PlatformSettings;
import com.quickbooks.repository.PlatformSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

@Service
public class PlatformSettingsService {

    private final PlatformSettingsRepository platformSettingsRepository;

    public PlatformSettingsService(PlatformSettingsRepository platformSettingsRepository) {
        this.platformSettingsRepository = platformSettingsRepository;
    }

    @Transactional(readOnly = true)
    public PlatformSettingsResponse getSettings() {
        return PlatformSettingsResponse.from(getOrCreateSettings());
    }

    @Transactional
    public PlatformCompanySettingsResponse updateCompanySettings(UpdatePlatformCompanySettingsRequest request) {
        PlatformSettings settings = getOrCreateSettings();

        if (request.getCompanyName() != null) {
            settings.setCompanyName(trimToNull(request.getCompanyName()));
        }
        if (request.getSupportEmail() != null) {
            settings.setSupportEmail(trimToNull(request.getSupportEmail()));
        }
        if (request.getContactEmail() != null) {
            settings.setContactEmail(trimToNull(request.getContactEmail()));
        }
        if (request.getMobileNumber() != null) {
            settings.setMobileNumber(trimToNull(request.getMobileNumber()));
        }
        if (request.getWebsiteUrl() != null) {
            settings.setWebsiteUrl(trimToNull(request.getWebsiteUrl()));
        }
        if (request.getAddressLine1() != null) {
            settings.setAddressLine1(trimToNull(request.getAddressLine1()));
        }
        if (request.getAddressLine2() != null) {
            settings.setAddressLine2(trimToNull(request.getAddressLine2()));
        }
        if (request.getCity() != null) {
            settings.setCity(trimToNull(request.getCity()));
        }
        if (request.getState() != null) {
            settings.setState(trimToNull(request.getState()));
        }
        if (request.getCountry() != null) {
            settings.setCountry(trimToNull(request.getCountry()));
        }
        if (request.getPostalCode() != null) {
            settings.setPostalCode(trimToNull(request.getPostalCode()));
        }

        settings.setUpdatedAt(OffsetDateTime.now());
        return PlatformCompanySettingsResponse.from(platformSettingsRepository.save(settings));
    }

    @Transactional
    public SmtpSettingsResponse updateSmtpSettings(UpdateSmtpSettingsRequest request) {
        PlatformSettings settings = getOrCreateSettings();

        if (request.getEnabled() != null) {
            settings.setSmtpEnabled(request.getEnabled());
        }
        if (request.getHost() != null) {
            settings.setSmtpHost(trimToNull(request.getHost()));
        }
        if (request.getPort() != null) {
            settings.setSmtpPort(request.getPort());
        }
        if (request.getUsername() != null) {
            settings.setSmtpUsername(trimToNull(request.getUsername()));
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            settings.setSmtpPassword(request.getPassword().trim());
        }
        if (request.getFromEmail() != null) {
            settings.setSmtpFromEmail(trimToNull(request.getFromEmail()));
        }
        if (request.getFromName() != null) {
            settings.setSmtpFromName(trimToNull(request.getFromName()));
        }
        if (request.getUseTls() != null) {
            settings.setSmtpUseTls(request.getUseTls());
        }
        if (request.getUseSsl() != null) {
            settings.setSmtpUseSsl(request.getUseSsl());
        }

        if (settings.isSmtpEnabled()) {
            validateSmtpConfiguration(settings);
        }

        settings.setUpdatedAt(OffsetDateTime.now());
        return SmtpSettingsResponse.from(platformSettingsRepository.save(settings));
    }

    private void validateSmtpConfiguration(PlatformSettings settings) {
        if (settings.getSmtpHost() == null || settings.getSmtpHost().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SMTP host is required when email is enabled");
        }
        if (settings.getSmtpPort() == null || settings.getSmtpPort() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SMTP port is required when email is enabled");
        }
        if (settings.getSmtpFromEmail() == null || settings.getSmtpFromEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "From email is required when email is enabled");
        }
    }

    private PlatformSettings getOrCreateSettings() {
        return platformSettingsRepository.findById(PlatformSettings.SINGLETON_ID)
                .orElseGet(() -> {
                    PlatformSettings settings = new PlatformSettings();
                    settings.setId(PlatformSettings.SINGLETON_ID);
                    settings.setSmtpPort(587);
                    return platformSettingsRepository.save(settings);
                });
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
