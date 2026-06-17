package com.quickbooks.dto.company;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateCompanyRequest {

    @NotBlank
    private String name;

    @NotNull
    private Long businessTypeId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getBusinessTypeId() { return businessTypeId; }
    public void setBusinessTypeId(Long businessTypeId) { this.businessTypeId = businessTypeId; }
}
