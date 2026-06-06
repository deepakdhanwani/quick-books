package com.quickbooks.dto.discount;

import com.quickbooks.entity.Discount;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.enums.DiscountScope;
import com.quickbooks.entity.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

public class DiscountResponse {

    private Long id;
    private String name;
    private DiscountType type;
    private BigDecimal value;
    private DiscountScope scope;
    private LocalDate validFrom;
    private LocalDate validTo;
    private boolean active;
    private OffsetDateTime createdAt;
    private List<Long> planIds;
    private List<String> planNames;
    private List<Long> subscriberIds;
    private List<String> subscriberNames;

    public static DiscountResponse from(Discount discount) {
        DiscountResponse response = new DiscountResponse();
        response.setId(discount.getId());
        response.setName(discount.getName());
        response.setType(discount.getType());
        response.setValue(discount.getValue());
        response.setScope(discount.getScope());
        response.setValidFrom(discount.getValidFrom());
        response.setValidTo(discount.getValidTo());
        response.setActive(discount.isActive());
        response.setCreatedAt(discount.getCreatedAt());

        List<SubscriptionPlan> plans = discount.getApplicablePlans().stream()
                .sorted(Comparator.comparing(SubscriptionPlan::getName))
                .toList();
        response.setPlanIds(plans.stream().map(SubscriptionPlan::getId).toList());
        response.setPlanNames(plans.stream().map(SubscriptionPlan::getName).toList());

        List<Subscriber> subscribers = discount.getSpecificSubscribers().stream()
                .sorted(Comparator.comparing(Subscriber::getBusinessName))
                .toList();
        response.setSubscriberIds(subscribers.stream().map(Subscriber::getId).toList());
        response.setSubscriberNames(subscribers.stream()
                .map(subscriber -> subscriber.getBusinessName() + " (" + subscriber.getPhone() + ")")
                .toList());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public DiscountType getType() { return type; }
    public void setType(DiscountType type) { this.type = type; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    public DiscountScope getScope() { return scope; }
    public void setScope(DiscountScope scope) { this.scope = scope; }
    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }
    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public List<Long> getPlanIds() { return planIds; }
    public void setPlanIds(List<Long> planIds) { this.planIds = planIds; }
    public List<String> getPlanNames() { return planNames; }
    public void setPlanNames(List<String> planNames) { this.planNames = planNames; }
    public List<Long> getSubscriberIds() { return subscriberIds; }
    public void setSubscriberIds(List<Long> subscriberIds) { this.subscriberIds = subscriberIds; }
    public List<String> getSubscriberNames() { return subscriberNames; }
    public void setSubscriberNames(List<String> subscriberNames) { this.subscriberNames = subscriberNames; }
}
