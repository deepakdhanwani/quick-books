package com.quickbooks.dto.subscriberuser;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SetSubscriberUserPinRequest {

    @NotBlank
    @Pattern(regexp = "^[0-9]{6,8}$", message = "PIN must be 6 to 8 digits")
    private String loginPin;

    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
}
