package com.quickbooks.dto.plan;

import com.quickbooks.entity.enums.PlanDuration;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateSubscriptionPlanRequest {

    @NotBlank
    private String name;

    @NotNull
    private PlanDuration duration;

    @NotNull
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;

    @NotNull
    @Min(value = 1, message = "Minimum companies must be at least 1")
    private Integer minCompanies;

    @NotNull
    @Min(value = 1, message = "Maximum companies must be at least 1")
    private Integer maxCompanies;

    private String description;

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
}
