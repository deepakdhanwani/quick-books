package com.quickbooks.dto.subscriber;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateSubscriberRequest {

    @NotBlank
    private String businessName;

    @NotBlank
    private String ownerName;

    @NotBlank
    private String phone;

    @NotNull
    private Long businessTypeId;

    @NotNull
    private Boolean active;

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getBusinessTypeId() { return businessTypeId; }
    public void setBusinessTypeId(Long businessTypeId) { this.businessTypeId = businessTypeId; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
