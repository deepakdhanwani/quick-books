package com.quickbooks.dto.subscriber;

import java.math.BigDecimal;

public class SubscriberDataSummaryResponse {

    private long customerCount;
    private long vendorCount;
    private long productCount;
    private long saleCount;
    private long purchaseCount;
    private long teamUserCount;
    private long auditLogCount;

    private BigDecimal totalSalesAmount = BigDecimal.ZERO;
    private BigDecimal totalPurchasesAmount = BigDecimal.ZERO;
    private BigDecimal pendingSalesAmount = BigDecimal.ZERO;
    private BigDecimal pendingPurchasesAmount = BigDecimal.ZERO;

    public long getCustomerCount() { return customerCount; }
    public void setCustomerCount(long customerCount) { this.customerCount = customerCount; }
    public long getVendorCount() { return vendorCount; }
    public void setVendorCount(long vendorCount) { this.vendorCount = vendorCount; }
    public long getProductCount() { return productCount; }
    public void setProductCount(long productCount) { this.productCount = productCount; }
    public long getSaleCount() { return saleCount; }
    public void setSaleCount(long saleCount) { this.saleCount = saleCount; }
    public long getPurchaseCount() { return purchaseCount; }
    public void setPurchaseCount(long purchaseCount) { this.purchaseCount = purchaseCount; }
    public long getTeamUserCount() { return teamUserCount; }
    public void setTeamUserCount(long teamUserCount) { this.teamUserCount = teamUserCount; }
    public long getAuditLogCount() { return auditLogCount; }
    public void setAuditLogCount(long auditLogCount) { this.auditLogCount = auditLogCount; }
    public BigDecimal getTotalSalesAmount() { return totalSalesAmount; }
    public void setTotalSalesAmount(BigDecimal totalSalesAmount) { this.totalSalesAmount = totalSalesAmount; }
    public BigDecimal getTotalPurchasesAmount() { return totalPurchasesAmount; }
    public void setTotalPurchasesAmount(BigDecimal totalPurchasesAmount) { this.totalPurchasesAmount = totalPurchasesAmount; }
    public BigDecimal getPendingSalesAmount() { return pendingSalesAmount; }
    public void setPendingSalesAmount(BigDecimal pendingSalesAmount) { this.pendingSalesAmount = pendingSalesAmount; }
    public BigDecimal getPendingPurchasesAmount() { return pendingPurchasesAmount; }
    public void setPendingPurchasesAmount(BigDecimal pendingPurchasesAmount) { this.pendingPurchasesAmount = pendingPurchasesAmount; }
}
