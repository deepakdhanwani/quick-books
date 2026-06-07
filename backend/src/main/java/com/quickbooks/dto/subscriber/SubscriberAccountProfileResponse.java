package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class SubscriberAccountProfileResponse {

    private Long id;
    private String businessName;
    private String ownerName;
    private String phone;
    private String businessTypeName;
    private SubscriptionStatus subscriptionStatus;
    private boolean active;
    private BigDecimal defaultTaxPercent;
    private String gstNumber;
    private OffsetDateTime createdAt;
    private SubscriberSubscriptionInfo currentSubscription;

    public static SubscriberAccountProfileResponse from(Subscriber subscriber) {
        SubscriberAccountProfileResponse response = new SubscriberAccountProfileResponse();
        response.setId(subscriber.getId());
        response.setBusinessName(subscriber.getBusinessName());
        response.setOwnerName(subscriber.getOwnerName());
        response.setPhone(subscriber.getPhone());
        if (subscriber.getBusinessType() != null) {
            response.setBusinessTypeName(subscriber.getBusinessType().getName());
        }
        response.setSubscriptionStatus(subscriber.getSubscriptionStatus());
        response.setActive(subscriber.isActive());
        response.setDefaultTaxPercent(subscriber.getDefaultTaxPercent());
        response.setGstNumber(subscriber.getGstNumber());
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
    public String getBusinessTypeName() { return businessTypeName; }
    public void setBusinessTypeName(String businessTypeName) { this.businessTypeName = businessTypeName; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public BigDecimal getDefaultTaxPercent() { return defaultTaxPercent; }
    public void setDefaultTaxPercent(BigDecimal defaultTaxPercent) { this.defaultTaxPercent = defaultTaxPercent; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public SubscriberSubscriptionInfo getCurrentSubscription() { return currentSubscription; }
    public void setCurrentSubscription(SubscriberSubscriptionInfo currentSubscription) { this.currentSubscription = currentSubscription; }
}
