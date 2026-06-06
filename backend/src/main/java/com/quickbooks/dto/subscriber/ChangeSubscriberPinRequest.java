package com.quickbooks.dto.subscriber;

import jakarta.validation.constraints.NotBlank;

public class ChangeSubscriberPinRequest {

    @NotBlank
    private String currentPin;

    @NotBlank
    private String newPin;

    @NotBlank
    private String confirmNewPin;

    public String getCurrentPin() { return currentPin; }
    public void setCurrentPin(String currentPin) { this.currentPin = currentPin; }
    public String getNewPin() { return newPin; }
    public void setNewPin(String newPin) { this.newPin = newPin; }
    public String getConfirmNewPin() { return confirmNewPin; }
    public void setConfirmNewPin(String confirmNewPin) { this.confirmNewPin = confirmNewPin; }
}
