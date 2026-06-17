package com.quickbooks.dto.platform;

import com.quickbooks.entity.PlatformSettings;

import java.time.OffsetDateTime;

public class PlatformCompanySettingsResponse {

    private String companyName;
    private String supportEmail;
    private String contactEmail;
    private String mobileNumber;
    private String websiteUrl;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private OffsetDateTime updatedAt;

    public static PlatformCompanySettingsResponse from(PlatformSettings settings) {
        PlatformCompanySettingsResponse response = new PlatformCompanySettingsResponse();
        response.setCompanyName(settings.getCompanyName());
        response.setSupportEmail(settings.getSupportEmail());
        response.setContactEmail(settings.getContactEmail());
        response.setMobileNumber(settings.getMobileNumber());
        response.setWebsiteUrl(settings.getWebsiteUrl());
        response.setAddressLine1(settings.getAddressLine1());
        response.setAddressLine2(settings.getAddressLine2());
        response.setCity(settings.getCity());
        response.setState(settings.getState());
        response.setCountry(settings.getCountry());
        response.setPostalCode(settings.getPostalCode());
        response.setUpdatedAt(settings.getUpdatedAt());
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
    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
