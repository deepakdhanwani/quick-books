package com.quickbooks.dto.report;

public class ReportSummaryItemDto {

    private String label;
    private String value;

    public ReportSummaryItemDto() {
    }

    public ReportSummaryItemDto(String label, String value) {
        this.label = label;
        this.value = value;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
