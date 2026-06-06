package com.quickbooks.dto.businesstype;

import com.quickbooks.entity.BusinessType;

import java.time.OffsetDateTime;

public class BusinessTypeResponse {

    private Long id;
    private String name;
    private String description;
    private boolean active;
    private OffsetDateTime createdAt;

    public static BusinessTypeResponse from(BusinessType businessType) {
        BusinessTypeResponse response = new BusinessTypeResponse();
        response.setId(businessType.getId());
        response.setName(businessType.getName());
        response.setDescription(businessType.getDescription());
        response.setActive(businessType.isActive());
        response.setCreatedAt(businessType.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
