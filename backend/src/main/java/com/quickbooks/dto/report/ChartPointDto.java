package com.quickbooks.dto.report;

import java.math.BigDecimal;

public class ChartPointDto {

    private String label;
    private BigDecimal value;
    private boolean projected;

    public ChartPointDto() {
    }

    public ChartPointDto(String label, BigDecimal value) {
        this.label = label;
        this.value = value;
        this.projected = false;
    }

    public ChartPointDto(String label, BigDecimal value, boolean projected) {
        this.label = label;
        this.value = value;
        this.projected = projected;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    public boolean isProjected() { return projected; }
    public void setProjected(boolean projected) { this.projected = projected; }
}
