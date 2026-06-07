package com.quickbooks.dto.subscriber;

import java.math.BigDecimal;

public class CashFlowOutlookDto {

    private BigDecimal expectedInflow = BigDecimal.ZERO;
    private BigDecimal expectedOutflow = BigDecimal.ZERO;
    private BigDecimal netOutlook = BigDecimal.ZERO;
    private BigDecimal receivables = BigDecimal.ZERO;
    private BigDecimal payables = BigDecimal.ZERO;
    private String summary;

    public BigDecimal getExpectedInflow() { return expectedInflow; }
    public void setExpectedInflow(BigDecimal expectedInflow) { this.expectedInflow = expectedInflow; }
    public BigDecimal getExpectedOutflow() { return expectedOutflow; }
    public void setExpectedOutflow(BigDecimal expectedOutflow) { this.expectedOutflow = expectedOutflow; }
    public BigDecimal getNetOutlook() { return netOutlook; }
    public void setNetOutlook(BigDecimal netOutlook) { this.netOutlook = netOutlook; }
    public BigDecimal getReceivables() { return receivables; }
    public void setReceivables(BigDecimal receivables) { this.receivables = receivables; }
    public BigDecimal getPayables() { return payables; }
    public void setPayables(BigDecimal payables) { this.payables = payables; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
}
