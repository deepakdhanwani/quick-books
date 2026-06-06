package com.quickbooks.dto.tax;

import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.Tax;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

public class TaxResponse {

    private Long id;
    private String name;
    private BigDecimal rate;
    private boolean active;
    private OffsetDateTime createdAt;
    private List<Long> applicablePlanIds;
    private List<String> applicablePlanNames;

    public static TaxResponse from(Tax tax) {
        TaxResponse response = new TaxResponse();
        response.setId(tax.getId());
        response.setName(tax.getName());
        response.setRate(tax.getRate());
        response.setActive(tax.isActive());
        response.setCreatedAt(tax.getCreatedAt());

        List<SubscriptionPlan> plans = tax.getApplicablePlans().stream()
                .sorted(Comparator.comparing(SubscriptionPlan::getName))
                .toList();
        response.setApplicablePlanIds(plans.stream().map(SubscriptionPlan::getId).toList());
        response.setApplicablePlanNames(plans.stream().map(SubscriptionPlan::getName).toList());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public List<Long> getApplicablePlanIds() { return applicablePlanIds; }
    public void setApplicablePlanIds(List<Long> applicablePlanIds) { this.applicablePlanIds = applicablePlanIds; }
    public List<String> getApplicablePlanNames() { return applicablePlanNames; }
    public void setApplicablePlanNames(List<String> applicablePlanNames) { this.applicablePlanNames = applicablePlanNames; }
}
