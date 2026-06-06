package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.SubscriptionStatus;

import java.time.OffsetDateTime;

public class SubscriberResponse {

    private Long id;
    private String businessName;
    private String ownerName;
    private String phone;
    private Long businessTypeId;
    private String businessTypeName;
    private SubscriptionStatus subscriptionStatus;
    private boolean active;
    private OffsetDateTime createdAt;
    private String loginPin;

    public static SubscriberResponse from(Subscriber subscriber) {
        SubscriberResponse response = new SubscriberResponse();
        response.setId(subscriber.getId());
        response.setBusinessName(subscriber.getBusinessName());
        response.setOwnerName(subscriber.getOwnerName());
        response.setPhone(subscriber.getPhone());
        if (subscriber.getBusinessType() != null) {
            response.setBusinessTypeId(subscriber.getBusinessType().getId());
            response.setBusinessTypeName(subscriber.getBusinessType().getName());
        }
        response.setSubscriptionStatus(subscriber.getSubscriptionStatus());
        response.setActive(subscriber.isActive());
        response.setCreatedAt(subscriber.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getBusinessTypeId() { return businessTypeId; }
    public void setBusinessTypeId(Long businessTypeId) { this.businessTypeId = businessTypeId; }
    public String getBusinessTypeName() { return businessTypeName; }
    public void setBusinessTypeName(String businessTypeName) { this.businessTypeName = businessTypeName; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
}
