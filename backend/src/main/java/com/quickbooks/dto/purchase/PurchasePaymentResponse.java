package com.quickbooks.dto.purchase;

import com.quickbooks.entity.Payment;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentSettlementType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class PurchasePaymentResponse {

    private Long id;
    private BigDecimal amount;
    private LocalDate date;
    private PaymentMode paymentMode;
    private String paymentDetails;
    private String notes;
    private boolean hasProof;
    private String proofFileName;
    private BigDecimal adjustedAmount;
    private PaymentSettlementType settlementType;
    private OffsetDateTime createdAt;

    public static PurchasePaymentResponse from(Payment payment) {
        PurchasePaymentResponse response = new PurchasePaymentResponse();
        response.setId(payment.getId());
        response.setAmount(payment.getAmount());
        response.setDate(payment.getDate());
        response.setPaymentMode(payment.getPaymentMode());
        response.setPaymentDetails(payment.getPaymentDetails());
        response.setNotes(payment.getNotes());
        response.setHasProof(payment.getProofFilePath() != null && !payment.getProofFilePath().isBlank());
        response.setProofFileName(payment.getProofFileName());
        response.setAdjustedAmount(payment.getAdjustedAmount());
        response.setSettlementType(payment.getSettlementType());
        response.setCreatedAt(payment.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }
    public String getPaymentDetails() { return paymentDetails; }
    public void setPaymentDetails(String paymentDetails) { this.paymentDetails = paymentDetails; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public boolean isHasProof() { return hasProof; }
    public void setHasProof(boolean hasProof) { this.hasProof = hasProof; }
    public String getProofFileName() { return proofFileName; }
    public void setProofFileName(String proofFileName) { this.proofFileName = proofFileName; }
    public BigDecimal getAdjustedAmount() { return adjustedAmount; }
    public void setAdjustedAmount(BigDecimal adjustedAmount) { this.adjustedAmount = adjustedAmount; }
    public PaymentSettlementType getSettlementType() { return settlementType; }
    public void setSettlementType(PaymentSettlementType settlementType) { this.settlementType = settlementType; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
