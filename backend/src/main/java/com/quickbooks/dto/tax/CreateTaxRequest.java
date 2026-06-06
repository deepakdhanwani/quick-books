package com.quickbooks.dto.tax;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class CreateTaxRequest {

    @NotBlank
    private String name;

    @NotNull
    @DecimalMin(value = "0.01", message = "Rate must be greater than zero")
    @DecimalMax(value = "100.00", message = "Rate cannot exceed 100%")
    private BigDecimal rate;

    @NotEmpty(message = "Select at least one subscription plan")
    private List<Long> planIds;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public List<Long> getPlanIds() { return planIds; }
    public void setPlanIds(List<Long> planIds) { this.planIds = planIds; }
}
