package com.quickbooks.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class UpdateProductRequest {

    @NotBlank
    private String name;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal sellingPrice;

    private BigDecimal discount;
    private Boolean active;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
