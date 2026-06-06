package com.quickbooks.dto.report;

public class ReportColumnDto {

    private String key;
    private String label;
    private String align;

    public ReportColumnDto() {
    }

    public ReportColumnDto(String key, String label, String align) {
        this.key = key;
        this.label = label;
        this.align = align;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getAlign() { return align; }
    public void setAlign(String align) { this.align = align; }
}
