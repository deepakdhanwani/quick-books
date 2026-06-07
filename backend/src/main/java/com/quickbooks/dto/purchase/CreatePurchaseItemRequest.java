package com.quickbooks.dto.purchase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreatePurchaseItemRequest {

    @NotNull
    private Long productId;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal quantity;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
}
