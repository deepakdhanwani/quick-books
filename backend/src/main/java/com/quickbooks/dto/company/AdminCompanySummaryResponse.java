package com.quickbooks.dto.company;

import com.quickbooks.entity.Company;
import com.quickbooks.service.demo.DemoNaming;

public class AdminCompanySummaryResponse {

    private Long id;
    private String name;
    private String alias;
    private Long businessTypeId;
    private String businessTypeName;
    private boolean defaultCompany;
    private boolean active;
    private java.time.OffsetDateTime createdAt;
    private long customerCount;
    private long vendorCount;
    private long productCount;
    private long saleCount;
    private long purchaseCount;

    public static AdminCompanySummaryResponse from(Company company, Long defaultCompanyId) {
        AdminCompanySummaryResponse response = new AdminCompanySummaryResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setAlias(DemoNaming.companyAlias(company.getName()));
        if (company.getBusinessType() != null) {
            response.setBusinessTypeId(company.getBusinessType().getId());
            response.setBusinessTypeName(company.getBusinessType().getName());
        }
        response.setDefaultCompany(defaultCompanyId != null && defaultCompanyId.equals(company.getId()));
        response.setActive(company.isActive());
        response.setCreatedAt(company.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public Long getBusinessTypeId() { return businessTypeId; }
    public void setBusinessTypeId(Long businessTypeId) { this.businessTypeId = businessTypeId; }
    public String getBusinessTypeName() { return businessTypeName; }
    public void setBusinessTypeName(String businessTypeName) { this.businessTypeName = businessTypeName; }
    public boolean isDefaultCompany() { return defaultCompany; }
    public void setDefaultCompany(boolean defaultCompany) { this.defaultCompany = defaultCompany; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public java.time.OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.OffsetDateTime createdAt) { this.createdAt = createdAt; }
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
