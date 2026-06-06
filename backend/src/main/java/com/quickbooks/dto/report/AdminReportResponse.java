package com.quickbooks.dto.report;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AdminReportResponse {

    private String reportType;
    private String title;
    private OffsetDateTime generatedAt = OffsetDateTime.now();
    private Map<String, String> filters = new LinkedHashMap<>();
    private List<ReportSummaryItemDto> summary = new ArrayList<>();
    private List<ReportColumnDto> columns = new ArrayList<>();
    private List<Map<String, String>> rows = new ArrayList<>();
    private List<ChartPointDto> chartData = new ArrayList<>();

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(OffsetDateTime generatedAt) { this.generatedAt = generatedAt; }
    public Map<String, String> getFilters() { return filters; }
    public void setFilters(Map<String, String> filters) { this.filters = filters; }
    public List<ReportSummaryItemDto> getSummary() { return summary; }
    public void setSummary(List<ReportSummaryItemDto> summary) { this.summary = summary; }
    public List<ReportColumnDto> getColumns() { return columns; }
    public void setColumns(List<ReportColumnDto> columns) { this.columns = columns; }
    public List<Map<String, String>> getRows() { return rows; }
    public void setRows(List<Map<String, String>> rows) { this.rows = rows; }
    public List<ChartPointDto> getChartData() { return chartData; }
    public void setChartData(List<ChartPointDto> chartData) { this.chartData = chartData; }
}
