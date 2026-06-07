package com.quickbooks.dto.product;

import com.quickbooks.entity.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

public class ProductResponse {

    private Long id;
    private String name;
    private BigDecimal sellingPrice;
    private BigDecimal discount;
    private BigDecimal netAmount;
    private boolean active;
    private OffsetDateTime createdAt;

    public static ProductResponse from(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setSellingPrice(product.getSellingPrice());
        response.setDiscount(product.getDiscount());
        response.setNetAmount(calculateNetAmount(product.getSellingPrice(), product.getDiscount()));
        response.setActive(product.isActive());
        response.setCreatedAt(product.getCreatedAt());
        return response;
    }

    public static BigDecimal calculateNetAmount(BigDecimal sellingPrice, BigDecimal discount) {
        BigDecimal normalizedDiscount = discount == null ? BigDecimal.ZERO : discount;
        return sellingPrice.subtract(normalizedDiscount).setScale(2, RoundingMode.HALF_UP);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
