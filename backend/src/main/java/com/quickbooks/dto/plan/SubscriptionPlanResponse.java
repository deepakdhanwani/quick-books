package com.quickbooks.dto.plan;

import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.enums.PlanDuration;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class SubscriptionPlanResponse {

    private Long id;
    private String name;
    private PlanDuration duration;
    private BigDecimal price;
    private String description;
    private boolean active;
    private OffsetDateTime createdAt;

    public static SubscriptionPlanResponse from(SubscriptionPlan plan) {
        SubscriptionPlanResponse response = new SubscriptionPlanResponse();
        response.setId(plan.getId());
        response.setName(plan.getName());
        response.setDuration(plan.getDuration());
        response.setPrice(plan.getPrice());
        response.setDescription(plan.getDescription());
        response.setActive(plan.isActive());
        response.setCreatedAt(plan.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public PlanDuration getDuration() { return duration; }
    public void setDuration(PlanDuration duration) { this.duration = duration; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
