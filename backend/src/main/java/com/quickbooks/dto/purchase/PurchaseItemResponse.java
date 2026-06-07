package com.quickbooks.dto.purchase;

import com.quickbooks.entity.PurchaseItem;

import java.math.BigDecimal;

public class PurchaseItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String description;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal amount;

    public static PurchaseItemResponse from(PurchaseItem item) {
        PurchaseItemResponse response = new PurchaseItemResponse();
        response.setId(item.getId());
        if (item.getProduct() != null) {
            response.setProductId(item.getProduct().getId());
            response.setProductName(item.getProduct().getName());
            response.setDiscount(item.getProduct().getDiscount());
        }
        response.setDescription(item.getDescription());
        response.setQuantity(item.getQuantity());
        response.setUnitPrice(item.getUnitPrice());
        response.setAmount(item.getAmount());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
