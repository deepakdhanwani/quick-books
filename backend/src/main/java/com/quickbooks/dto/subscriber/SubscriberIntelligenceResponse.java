package com.quickbooks.dto.subscriber;

import com.quickbooks.dto.report.ChartPointDto;

import java.util.ArrayList;
import java.util.List;

public class SubscriberIntelligenceResponse {

    private int healthScore;
    private String healthLabel;
    private String healthSummary;

    private List<ForecastMetricDto> forecasts = new ArrayList<>();
    private CashFlowOutlookDto cashFlowOutlook = new CashFlowOutlookDto();
    private List<BusinessInsightDto> insights = new ArrayList<>();
    private List<ChartPointDto> salesTrend = new ArrayList<>();
    private List<ChartPointDto> purchaseTrend = new ArrayList<>();

    public int getHealthScore() { return healthScore; }
    public void setHealthScore(int healthScore) { this.healthScore = healthScore; }
    public String getHealthLabel() { return healthLabel; }
    public void setHealthLabel(String healthLabel) { this.healthLabel = healthLabel; }
    public String getHealthSummary() { return healthSummary; }
    public void setHealthSummary(String healthSummary) { this.healthSummary = healthSummary; }
    public List<ForecastMetricDto> getForecasts() { return forecasts; }
    public void setForecasts(List<ForecastMetricDto> forecasts) { this.forecasts = forecasts; }
    public CashFlowOutlookDto getCashFlowOutlook() { return cashFlowOutlook; }
    public void setCashFlowOutlook(CashFlowOutlookDto cashFlowOutlook) { this.cashFlowOutlook = cashFlowOutlook; }
    public List<BusinessInsightDto> getInsights() { return insights; }
    public void setInsights(List<BusinessInsightDto> insights) { this.insights = insights; }
    public List<ChartPointDto> getSalesTrend() { return salesTrend; }
    public void setSalesTrend(List<ChartPointDto> salesTrend) { this.salesTrend = salesTrend; }
    public List<ChartPointDto> getPurchaseTrend() { return purchaseTrend; }
    public void setPurchaseTrend(List<ChartPointDto> purchaseTrend) { this.purchaseTrend = purchaseTrend; }
}
