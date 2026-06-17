package com.quickbooks.dto.ledger;

import java.math.BigDecimal;

public class PartyLedgerSummaryResponse {

    private BigDecimal totalDebit = BigDecimal.ZERO;
    private BigDecimal totalCredit = BigDecimal.ZERO;
    private BigDecimal totalAdjusted = BigDecimal.ZERO;
    private BigDecimal closingBalance = BigDecimal.ZERO;
    private BigDecimal openingDebit = BigDecimal.ZERO;
    private BigDecimal openingCredit = BigDecimal.ZERO;
    private BigDecimal openingBalance = BigDecimal.ZERO;
    private long entryCount;

    public BigDecimal getTotalDebit() { return totalDebit; }
    public void setTotalDebit(BigDecimal totalDebit) { this.totalDebit = totalDebit; }
    public BigDecimal getTotalCredit() { return totalCredit; }
    public void setTotalCredit(BigDecimal totalCredit) { this.totalCredit = totalCredit; }
    public BigDecimal getTotalAdjusted() { return totalAdjusted; }
    public void setTotalAdjusted(BigDecimal totalAdjusted) { this.totalAdjusted = totalAdjusted; }
    public BigDecimal getClosingBalance() { return closingBalance; }
    public void setClosingBalance(BigDecimal closingBalance) { this.closingBalance = closingBalance; }
    public BigDecimal getOpeningDebit() { return openingDebit; }
    public void setOpeningDebit(BigDecimal openingDebit) { this.openingDebit = openingDebit; }
    public BigDecimal getOpeningCredit() { return openingCredit; }
    public void setOpeningCredit(BigDecimal openingCredit) { this.openingCredit = openingCredit; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public long getEntryCount() { return entryCount; }
    public void setEntryCount(long entryCount) { this.entryCount = entryCount; }
}
