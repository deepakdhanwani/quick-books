package com.quickbooks.dto.subscriberuser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateSubscriberUserRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    private Boolean active;

    @Valid
    private StaffPermissionsRequest permissions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public StaffPermissionsRequest getPermissions() { return permissions; }
    public void setPermissions(StaffPermissionsRequest permissions) { this.permissions = permissions; }
}
