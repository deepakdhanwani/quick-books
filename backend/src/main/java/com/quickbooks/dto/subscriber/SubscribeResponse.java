package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.enums.SubscriptionStatus;

public class SubscribeResponse {

    private SubscriberSubscriptionInfo subscription;
    private SubscriptionStatus subscriptionStatus;
    private boolean requiresSubscription;

    public SubscriberSubscriptionInfo getSubscription() { return subscription; }
    public void setSubscription(SubscriberSubscriptionInfo subscription) { this.subscription = subscription; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public boolean isRequiresSubscription() { return requiresSubscription; }
    public void setRequiresSubscription(boolean requiresSubscription) { this.requiresSubscription = requiresSubscription; }
}
