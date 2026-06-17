package com.quickbooks.dto.subscriber;

import com.quickbooks.dto.company.CompanyResponse;
import com.quickbooks.dto.subscriberuser.StaffPermissionsResponse;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.AppFontSize;
import com.quickbooks.entity.enums.AppTheme;
import com.quickbooks.entity.enums.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

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
    private String loggedInUserName;
    private String userType;
    private boolean canChangePin = true;
    private boolean owner = true;
    private AppTheme theme;
    private AppFontSize fontSize;
    private List<CompanyResponse> companies;
    private StaffPermissionsResponse staffPermissions;

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
    public String getLoggedInUserName() { return loggedInUserName; }
    public void setLoggedInUserName(String loggedInUserName) { this.loggedInUserName = loggedInUserName; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
    public boolean isCanChangePin() { return canChangePin; }
    public void setCanChangePin(boolean canChangePin) { this.canChangePin = canChangePin; }
    public boolean isOwner() { return owner; }
    public void setOwner(boolean owner) { this.owner = owner; }
    public AppTheme getTheme() { return theme; }
    public void setTheme(AppTheme theme) { this.theme = theme; }
    public AppFontSize getFontSize() { return fontSize; }
    public void setFontSize(AppFontSize fontSize) { this.fontSize = fontSize; }
    public List<CompanyResponse> getCompanies() { return companies; }
    public void setCompanies(List<CompanyResponse> companies) { this.companies = companies; }
    public StaffPermissionsResponse getStaffPermissions() { return staffPermissions; }
    public void setStaffPermissions(StaffPermissionsResponse staffPermissions) { this.staffPermissions = staffPermissions; }
}
