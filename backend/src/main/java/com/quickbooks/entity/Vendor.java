package com.quickbooks.entity;

import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.entity.enums.OpeningBalanceNature;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "vendors")
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private Subscriber subscriber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String name;

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "vendor_type")
    private CustomerType vendorType;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "business_details", columnDefinition = "TEXT")
    private String businessDetails;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "opening_balance", nullable = false)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "opening_balance_nature", nullable = false)
    private OpeningBalanceNature openingBalanceNature = OpeningBalanceNature.TO_PAY;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Subscriber getSubscriber() { return subscriber; }
    public void setSubscriber(Subscriber subscriber) { this.subscriber = subscriber; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public CustomerType getVendorType() { return vendorType; }
    public void setVendorType(CustomerType vendorType) { this.vendorType = vendorType; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public String getBusinessDetails() { return businessDetails; }
    public void setBusinessDetails(String businessDetails) { this.businessDetails = businessDetails; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public OpeningBalanceNature getOpeningBalanceNature() { return openingBalanceNature; }
    public void setOpeningBalanceNature(OpeningBalanceNature openingBalanceNature) {
        this.openingBalanceNature = openingBalanceNature;
    }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
