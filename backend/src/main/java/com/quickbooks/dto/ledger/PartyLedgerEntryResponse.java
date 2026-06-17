package com.quickbooks.dto.ledger;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PartyLedgerEntryResponse {

    private String id;
    private LocalDate date;
    private String kind;
    private Long referenceId;
    private String referenceLabel;
    private String particulars;
    private BigDecimal debit = BigDecimal.ZERO;
    private BigDecimal credit = BigDecimal.ZERO;
    private BigDecimal balance = BigDecimal.ZERO;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public String getReferenceLabel() { return referenceLabel; }
    public void setReferenceLabel(String referenceLabel) { this.referenceLabel = referenceLabel; }
    public String getParticulars() { return particulars; }
    public void setParticulars(String particulars) { this.particulars = particulars; }
    public BigDecimal getDebit() { return debit; }
    public void setDebit(BigDecimal debit) { this.debit = debit; }
    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}
