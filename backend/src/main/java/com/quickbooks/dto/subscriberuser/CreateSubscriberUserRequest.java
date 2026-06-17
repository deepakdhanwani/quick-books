package com.quickbooks.dto.subscriberuser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateSubscriberUserRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Pattern(regexp = "^[0-9]{6,8}$", message = "PIN must be 6 to 8 digits")
    private String loginPin;

    @Valid
    @NotNull
    private StaffPermissionsRequest permissions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public StaffPermissionsRequest getPermissions() { return permissions; }
    public void setPermissions(StaffPermissionsRequest permissions) { this.permissions = permissions; }
}
