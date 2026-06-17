package com.quickbooks.dto.platform;

import com.quickbooks.entity.PlatformSettings;

public class PlatformBrandingResponse {

    private String companyName;
    private String supportEmail;
    private String contactEmail;
    private String mobileNumber;
    private String websiteUrl;

    public static PlatformBrandingResponse from(PlatformSettings settings) {
        PlatformBrandingResponse response = new PlatformBrandingResponse();
        response.setCompanyName(settings.getCompanyName());
        response.setSupportEmail(settings.getSupportEmail());
        response.setContactEmail(settings.getContactEmail());
        response.setMobileNumber(settings.getMobileNumber());
        response.setWebsiteUrl(settings.getWebsiteUrl());
        return response;
    }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getSupportEmail() { return supportEmail; }
    public void setSupportEmail(String supportEmail) { this.supportEmail = supportEmail; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
}
