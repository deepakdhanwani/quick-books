package com.quickbooks.dto.settings;

import java.time.OffsetDateTime;

public class DemoSubscriberResponse {

    private Long id;
    private String businessName;
    private String ownerName;
    private String phone;
    private String loginPin;
    private Long businessTypeId;
    private String businessTypeName;
    private OffsetDateTime createdAt;
    private long customerCount;
    private long vendorCount;
    private long productCount;
    private long saleCount;
    private long purchaseCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public Long getBusinessTypeId() { return businessTypeId; }
    public void setBusinessTypeId(Long businessTypeId) { this.businessTypeId = businessTypeId; }
    public String getBusinessTypeName() { return businessTypeName; }
    public void setBusinessTypeName(String businessTypeName) { this.businessTypeName = businessTypeName; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public long getCustomerCount() { return customerCount; }
    public void setCustomerCount(long customerCount) { this.customerCount = customerCount; }
    public long getVendorCount() { return vendorCount; }
    public void setVendorCount(long vendorCount) { this.vendorCount = vendorCount; }
    public long getProductCount() { return productCount; }
    public void setProductCount(long productCount) { this.productCount = productCount; }
    public long getSaleCount() { return saleCount; }
    public void setSaleCount(long saleCount) { this.saleCount = saleCount; }
    public long getPurchaseCount() { return purchaseCount; }
    public void setPurchaseCount(long purchaseCount) { this.purchaseCount = purchaseCount; }
}
