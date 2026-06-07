package com.quickbooks.dto.vendor;

import jakarta.validation.constraints.NotNull;

public class UpdateVendorActiveRequest {

    @NotNull
    private Boolean active;

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
