package com.quickbooks.dto.report;

import java.math.BigDecimal;

public class ChartPointDto {

    private String label;
    private BigDecimal value;

    public ChartPointDto() {
    }

    public ChartPointDto(String label, BigDecimal value) {
        this.label = label;
        this.value = value;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
}
