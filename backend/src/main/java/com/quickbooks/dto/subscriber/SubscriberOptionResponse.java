package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.Subscriber;

public class SubscriberOptionResponse {

    private Long id;
    private String businessName;
    private String ownerName;
    private String phone;

    public static SubscriberOptionResponse from(Subscriber subscriber) {
        SubscriberOptionResponse response = new SubscriberOptionResponse();
        response.setId(subscriber.getId());
        response.setBusinessName(subscriber.getBusinessName());
        response.setOwnerName(subscriber.getOwnerName());
        response.setPhone(subscriber.getPhone());
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
}
