package com.quickbooks.dto.platform;

import com.quickbooks.entity.PlatformSettings;

public class PlatformSettingsResponse {

    private PlatformCompanySettingsResponse company;
    private SmtpSettingsResponse smtp;

    public static PlatformSettingsResponse from(PlatformSettings settings) {
        PlatformSettingsResponse response = new PlatformSettingsResponse();
        response.setCompany(PlatformCompanySettingsResponse.from(settings));
        response.setSmtp(SmtpSettingsResponse.from(settings));
        return response;
    }

    public PlatformCompanySettingsResponse getCompany() { return company; }
    public void setCompany(PlatformCompanySettingsResponse company) { this.company = company; }
    public SmtpSettingsResponse getSmtp() { return smtp; }
    public void setSmtp(SmtpSettingsResponse smtp) { this.smtp = smtp; }
}
