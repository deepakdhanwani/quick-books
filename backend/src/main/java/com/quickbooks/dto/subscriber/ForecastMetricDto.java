package com.quickbooks.dto.subscriber;

import java.math.BigDecimal;

public class ForecastMetricDto {

    private String key;
    private String label;
    private BigDecimal currentValue = BigDecimal.ZERO;
    private BigDecimal projectedValue = BigDecimal.ZERO;
    private BigDecimal previousValue = BigDecimal.ZERO;
    private double changePercent;
    private String period;

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public BigDecimal getProjectedValue() { return projectedValue; }
    public void setProjectedValue(BigDecimal projectedValue) { this.projectedValue = projectedValue; }
    public BigDecimal getPreviousValue() { return previousValue; }
    public void setPreviousValue(BigDecimal previousValue) { this.previousValue = previousValue; }
    public double getChangePercent() { return changePercent; }
    public void setChangePercent(double changePercent) { this.changePercent = changePercent; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
}
