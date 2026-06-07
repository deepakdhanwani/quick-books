package com.quickbooks.dto.customer;

import jakarta.validation.constraints.NotNull;

public class UpdateCustomerActiveRequest {

    @NotNull
    private Boolean active;

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
