package com.quickbooks.dto.businesstype;

import jakarta.validation.constraints.NotBlank;

public class CreateBusinessTypeRequest {

    @NotBlank
    private String name;

    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
