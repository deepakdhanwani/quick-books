package com.quickbooks.dto.auth;

import com.quickbooks.entity.enums.SubscriptionStatus;

public class AuthResponse {

    private String token;
    private String role;
    private Long userId;
    private SubscriptionStatus subscriptionStatus;
    private boolean requiresSubscription;

    public AuthResponse() {}

    public AuthResponse(String token, String role, Long userId) {
        this.token = token;
        this.role = role;
        this.userId = userId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public boolean isRequiresSubscription() { return requiresSubscription; }
    public void setRequiresSubscription(boolean requiresSubscription) { this.requiresSubscription = requiresSubscription; }
}
