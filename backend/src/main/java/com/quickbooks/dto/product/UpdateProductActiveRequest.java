package com.quickbooks.dto.product;

import jakarta.validation.constraints.NotNull;

public class UpdateProductActiveRequest {

    @NotNull
    private Boolean active;

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
