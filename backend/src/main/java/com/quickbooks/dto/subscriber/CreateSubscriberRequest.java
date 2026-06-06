package com.quickbooks.dto.subscriber;

import jakarta.validation.constraints.NotBlank;

public class CreateSubscriberRequest {

    @NotBlank
    private String businessName;

    @NotBlank
    private String ownerName;

    @NotBlank
    private String phone;

    private String businessType;

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
}
