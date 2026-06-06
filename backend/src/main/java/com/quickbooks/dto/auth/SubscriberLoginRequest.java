package com.quickbooks.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class SubscriberLoginRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String loginPin;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
}
