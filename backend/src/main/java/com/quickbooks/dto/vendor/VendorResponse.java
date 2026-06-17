package com.quickbooks.dto.vendor;

import com.quickbooks.entity.Vendor;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.entity.enums.OpeningBalanceNature;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class VendorResponse {

    private Long id;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private CustomerType vendorType;
    private String businessName;
    private String gstNumber;
    private String businessDetails;
    private boolean active;
    private OffsetDateTime createdAt;
    private BigDecimal openingBalance = BigDecimal.ZERO;
    private OpeningBalanceNature openingBalanceNature = OpeningBalanceNature.TO_PAY;
    private BigDecimal totalPendingAmount = BigDecimal.ZERO;

    public static VendorResponse from(Vendor vendor) {
        VendorResponse response = new VendorResponse();
        response.setId(vendor.getId());
        response.setName(vendor.getName());
        response.setContactPerson(vendor.getContactPerson());
        response.setPhone(vendor.getPhone());
        response.setEmail(vendor.getEmail());
        response.setAddress(vendor.getAddress());
        response.setVendorType(vendor.getVendorType());
        response.setBusinessName(vendor.getBusinessName());
        response.setGstNumber(vendor.getGstNumber());
        response.setBusinessDetails(vendor.getBusinessDetails());
        response.setActive(vendor.isActive());
        response.setCreatedAt(vendor.getCreatedAt());
        response.setOpeningBalance(vendor.getOpeningBalance());
        response.setOpeningBalanceNature(vendor.getOpeningBalanceNature());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public OpeningBalanceNature getOpeningBalanceNature() { return openingBalanceNature; }
    public void setOpeningBalanceNature(OpeningBalanceNature openingBalanceNature) {
        this.openingBalanceNature = openingBalanceNature;
    }
    public BigDecimal getTotalPendingAmount() { return totalPendingAmount; }
    public void setTotalPendingAmount(BigDecimal totalPendingAmount) { this.totalPendingAmount = totalPendingAmount; }
}
