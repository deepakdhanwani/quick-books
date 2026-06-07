package com.quickbooks.dto.subscriber;

import java.math.BigDecimal;

public class SubscriberDashboardResponse {

    private BigDecimal todaySales = BigDecimal.ZERO;
    private BigDecimal todayPurchases = BigDecimal.ZERO;
    private BigDecimal monthSales = BigDecimal.ZERO;
    private BigDecimal monthPurchases = BigDecimal.ZERO;
    private BigDecimal pendingReceivables = BigDecimal.ZERO;
    private BigDecimal pendingPayables = BigDecimal.ZERO;
    private BigDecimal monthNetPosition = BigDecimal.ZERO;

    private long customerCount;
    private long vendorCount;
    private long productCount;
    private long saleCount;
    private long purchaseCount;

    public BigDecimal getTodaySales() { return todaySales; }
    public void setTodaySales(BigDecimal todaySales) { this.todaySales = todaySales; }
    public BigDecimal getTodayPurchases() { return todayPurchases; }
    public void setTodayPurchases(BigDecimal todayPurchases) { this.todayPurchases = todayPurchases; }
    public BigDecimal getMonthSales() { return monthSales; }
    public void setMonthSales(BigDecimal monthSales) { this.monthSales = monthSales; }
    public BigDecimal getMonthPurchases() { return monthPurchases; }
    public void setMonthPurchases(BigDecimal monthPurchases) { this.monthPurchases = monthPurchases; }
    public BigDecimal getPendingReceivables() { return pendingReceivables; }
    public void setPendingReceivables(BigDecimal pendingReceivables) { this.pendingReceivables = pendingReceivables; }
    public BigDecimal getPendingPayables() { return pendingPayables; }
    public void setPendingPayables(BigDecimal pendingPayables) { this.pendingPayables = pendingPayables; }
    public BigDecimal getMonthNetPosition() { return monthNetPosition; }
    public void setMonthNetPosition(BigDecimal monthNetPosition) { this.monthNetPosition = monthNetPosition; }
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
}
