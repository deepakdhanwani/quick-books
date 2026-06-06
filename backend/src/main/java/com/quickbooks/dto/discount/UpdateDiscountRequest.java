package com.quickbooks.dto.discount;

import com.quickbooks.entity.enums.DiscountScope;
import com.quickbooks.entity.enums.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class UpdateDiscountRequest {

    @NotBlank
    private String name;

    @NotNull
    private DiscountType type;

    @NotNull
    @DecimalMin(value = "0.01", message = "Value must be greater than zero")
    private BigDecimal value;

    @NotNull
    private DiscountScope scope;

    private LocalDate validFrom;
    private LocalDate validTo;

    @NotEmpty(message = "Select at least one subscription plan")
    private List<Long> planIds;

    private List<Long> subscriberIds;
    private Boolean active;

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
    public List<Long> getPlanIds() { return planIds; }
    public void setPlanIds(List<Long> planIds) { this.planIds = planIds; }
    public List<Long> getSubscriberIds() { return subscriberIds; }
    public void setSubscriberIds(List<Long> subscriberIds) { this.subscriberIds = subscriberIds; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
