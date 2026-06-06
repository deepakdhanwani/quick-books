package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.enums.PlanDuration;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SubscriberSubscriptionInfo {

    private Long id;
    private String planName;
    private PlanDuration planDuration;
    private BigDecimal planPrice;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String discountName;
    private SubscriptionRecordStatus recordStatus;

    public static SubscriberSubscriptionInfo from(SubscriberSubscription subscription) {
        SubscriberSubscriptionInfo info = new SubscriberSubscriptionInfo();
        info.setId(subscription.getId());
        info.setPlanName(subscription.getPlan().getName());
        info.setPlanDuration(subscription.getPlan().getDuration());
        info.setPlanPrice(subscription.getPlan().getPrice());
        info.setStartDate(subscription.getStartDate());
        info.setEndDate(subscription.getEndDate());
        info.setTaxAmount(subscription.getTaxAmount());
        info.setTotalAmount(subscription.getTotalAmount());
        if (subscription.getDiscount() != null) {
            info.setDiscountName(subscription.getDiscount().getName());
        }
        info.setRecordStatus(subscription.getStatus());
        return info;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
    public PlanDuration getPlanDuration() { return planDuration; }
    public void setPlanDuration(PlanDuration planDuration) { this.planDuration = planDuration; }
    public BigDecimal getPlanPrice() { return planPrice; }
    public void setPlanPrice(BigDecimal planPrice) { this.planPrice = planPrice; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getDiscountName() { return discountName; }
    public void setDiscountName(String discountName) { this.discountName = discountName; }
    public SubscriptionRecordStatus getRecordStatus() { return recordStatus; }
    public void setRecordStatus(SubscriptionRecordStatus recordStatus) { this.recordStatus = recordStatus; }
}
