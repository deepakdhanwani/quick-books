package com.quickbooks.dto.vendor;

import com.quickbooks.entity.enums.CustomerType;
import jakarta.validation.constraints.NotBlank;

public class CreateVendorRequest {

    @NotBlank
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private Boolean active;
    private CustomerType vendorType;
    private String businessName;
    private String gstNumber;
    private String businessDetails;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public CustomerType getVendorType() { return vendorType; }
    public void setVendorType(CustomerType vendorType) { this.vendorType = vendorType; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public String getBusinessDetails() { return businessDetails; }
    public void setBusinessDetails(String businessDetails) { this.businessDetails = businessDetails; }
}
