package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.enums.PlanDuration;

import java.math.BigDecimal;

public class SubscriberPlanOptionResponse {

    private Long id;
    private String name;
    private PlanDuration duration;
    private BigDecimal price;
    private Integer minCompanies;
    private Integer maxCompanies;
    private String description;
    private BigDecimal discountAmount;
    private String discountName;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;

    public static SubscriberPlanOptionResponse from(SubscriptionPlan plan,
                                                    BigDecimal discountAmount,
                                                    String discountName,
                                                    BigDecimal taxAmount,
                                                    BigDecimal totalAmount) {
        SubscriberPlanOptionResponse response = new SubscriberPlanOptionResponse();
        response.setId(plan.getId());
        response.setName(plan.getName());
        response.setDuration(plan.getDuration());
        response.setPrice(plan.getPrice());
        response.setMinCompanies(plan.getMinCompanies());
        response.setMaxCompanies(plan.getMaxCompanies());
        response.setDescription(plan.getDescription());
        response.setDiscountAmount(discountAmount);
        response.setDiscountName(discountName);
        response.setTaxAmount(taxAmount);
        response.setTotalAmount(totalAmount);
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
    public Integer getMinCompanies() { return minCompanies; }
    public void setMinCompanies(Integer minCompanies) { this.minCompanies = minCompanies; }
    public Integer getMaxCompanies() { return maxCompanies; }
    public void setMaxCompanies(Integer maxCompanies) { this.maxCompanies = maxCompanies; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public String getDiscountName() { return discountName; }
    public void setDiscountName(String discountName) { this.discountName = discountName; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
