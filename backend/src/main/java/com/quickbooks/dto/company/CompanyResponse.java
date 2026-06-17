package com.quickbooks.dto.company;

import com.quickbooks.entity.Company;

import java.time.OffsetDateTime;

public class CompanyResponse {

    private Long id;
    private String name;
    private Long businessTypeId;
    private String businessTypeName;
    private boolean active;
    private boolean selected;
    private OffsetDateTime createdAt;

    public static CompanyResponse from(Company company, Long selectedCompanyId) {
        CompanyResponse response = new CompanyResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        if (company.getBusinessType() != null) {
            response.setBusinessTypeId(company.getBusinessType().getId());
            response.setBusinessTypeName(company.getBusinessType().getName());
        }
        response.setActive(company.isActive());
        response.setSelected(selectedCompanyId != null && selectedCompanyId.equals(company.getId()));
        response.setCreatedAt(company.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getBusinessTypeId() { return businessTypeId; }
    public void setBusinessTypeId(Long businessTypeId) { this.businessTypeId = businessTypeId; }
    public String getBusinessTypeName() { return businessTypeName; }
    public void setBusinessTypeName(String businessTypeName) { this.businessTypeName = businessTypeName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isSelected() { return selected; }
    public void setSelected(boolean selected) { this.selected = selected; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
