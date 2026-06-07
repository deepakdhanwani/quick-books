package com.quickbooks.dto.subscriber;

import java.math.BigDecimal;

public class UpdateSubscriberAccountSettingsRequest {

    private BigDecimal defaultTaxPercent;
    private String gstNumber;

    public BigDecimal getDefaultTaxPercent() { return defaultTaxPercent; }
    public void setDefaultTaxPercent(BigDecimal defaultTaxPercent) { this.defaultTaxPercent = defaultTaxPercent; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
}
