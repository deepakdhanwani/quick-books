package com.quickbooks.entity;

import com.quickbooks.entity.enums.AppFontSize;
import com.quickbooks.entity.enums.AppTheme;
import com.quickbooks.entity.enums.SubscriptionStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "subscribers")
public class Subscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(name = "login_pin_hash", nullable = false)
    private String loginPinHash;

    @Column(name = "login_pin")
    private String loginPin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_type_id")
    private BusinessType businessType;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.NONE;

    @Column(name = "default_tax_percent")
    private BigDecimal defaultTaxPercent;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_demo", nullable = false)
    private boolean demo = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_mode", nullable = false)
    private AppTheme themeMode = AppTheme.DARK;

    @Enumerated(EnumType.STRING)
    @Column(name = "font_size", nullable = false)
    private AppFontSize fontSize = AppFontSize.SMALL;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_company_id")
    private Company defaultCompany;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLoginPinHash() { return loginPinHash; }
    public void setLoginPinHash(String loginPinHash) { this.loginPinHash = loginPinHash; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public BusinessType getBusinessType() { return businessType; }
    public void setBusinessType(BusinessType businessType) { this.businessType = businessType; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public BigDecimal getDefaultTaxPercent() { return defaultTaxPercent; }
    public void setDefaultTaxPercent(BigDecimal defaultTaxPercent) { this.defaultTaxPercent = defaultTaxPercent; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isDemo() { return demo; }
    public void setDemo(boolean demo) { this.demo = demo; }
    public AppTheme getThemeMode() { return themeMode; }
    public void setThemeMode(AppTheme themeMode) { this.themeMode = themeMode; }
    public AppFontSize getFontSize() { return fontSize; }
    public void setFontSize(AppFontSize fontSize) { this.fontSize = fontSize; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public Company getDefaultCompany() { return defaultCompany; }
    public void setDefaultCompany(Company defaultCompany) { this.defaultCompany = defaultCompany; }
}
