package com.quickbooks.entity;

import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentType;
import com.quickbooks.entity.enums.ReferenceType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private Subscriber subscriber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType type;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", nullable = false)
    private ReferenceType referenceType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode")
    private PaymentMode paymentMode;

    @Column(name = "payment_details", columnDefinition = "TEXT")
    private String paymentDetails;

    @Column(name = "proof_file_name")
    private String proofFileName;

    @Column(name = "proof_file_path")
    private String proofFilePath;

    @Column(name = "proof_content_type")
    private String proofContentType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Subscriber getSubscriber() { return subscriber; }
    public void setSubscriber(Subscriber subscriber) { this.subscriber = subscriber; }
    public PaymentType getType() { return type; }
    public void setType(PaymentType type) { this.type = type; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public ReferenceType getReferenceType() { return referenceType; }
    public void setReferenceType(ReferenceType referenceType) { this.referenceType = referenceType; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }
    public String getPaymentDetails() { return paymentDetails; }
    public void setPaymentDetails(String paymentDetails) { this.paymentDetails = paymentDetails; }
    public String getProofFileName() { return proofFileName; }
    public void setProofFileName(String proofFileName) { this.proofFileName = proofFileName; }
    public String getProofFilePath() { return proofFilePath; }
    public void setProofFilePath(String proofFilePath) { this.proofFilePath = proofFilePath; }
    public String getProofContentType() { return proofContentType; }
    public void setProofContentType(String proofContentType) { this.proofContentType = proofContentType; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
