package com.quickbooks.dto.report;

import java.math.BigDecimal;

public class AdminDashboardSummaryResponse {

    private long totalSubscribers;
    private long activeSubscriptions;
    private long pendingSubscriptions;
    private long expiringSoon;
    private BigDecimal revenueMtd;

    public long getTotalSubscribers() { return totalSubscribers; }
    public void setTotalSubscribers(long totalSubscribers) { this.totalSubscribers = totalSubscribers; }
    public long getActiveSubscriptions() { return activeSubscriptions; }
    public void setActiveSubscriptions(long activeSubscriptions) { this.activeSubscriptions = activeSubscriptions; }
    public long getPendingSubscriptions() { return pendingSubscriptions; }
    public void setPendingSubscriptions(long pendingSubscriptions) { this.pendingSubscriptions = pendingSubscriptions; }
    public long getExpiringSoon() { return expiringSoon; }
    public void setExpiringSoon(long expiringSoon) { this.expiringSoon = expiringSoon; }
    public BigDecimal getRevenueMtd() { return revenueMtd; }
    public void setRevenueMtd(BigDecimal revenueMtd) { this.revenueMtd = revenueMtd; }
}
