package com.quickbooks.dto.customer;

import com.quickbooks.entity.Customer;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.entity.enums.OpeningBalanceNature;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class CustomerResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private CustomerType customerType;
    private String businessName;
    private String gstNumber;
    private String businessDetails;
    private boolean active;
    private OffsetDateTime createdAt;
    private BigDecimal openingBalance = BigDecimal.ZERO;
    private OpeningBalanceNature openingBalanceNature = OpeningBalanceNature.TO_RECEIVE;
    private BigDecimal totalPendingAmount = BigDecimal.ZERO;

    public static CustomerResponse from(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setName(customer.getName());
        response.setPhone(customer.getPhone());
        response.setEmail(customer.getEmail());
        response.setAddress(customer.getAddress());
        response.setCustomerType(customer.getCustomerType());
        response.setBusinessName(customer.getBusinessName());
        response.setGstNumber(customer.getGstNumber());
        response.setBusinessDetails(customer.getBusinessDetails());
        response.setActive(customer.isActive());
        response.setCreatedAt(customer.getCreatedAt());
        response.setOpeningBalance(customer.getOpeningBalance());
        response.setOpeningBalanceNature(customer.getOpeningBalanceNature());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public CustomerType getCustomerType() { return customerType; }
    public void setCustomerType(CustomerType customerType) { this.customerType = customerType; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public String getBusinessDetails() { return businessDetails; }
    public void setBusinessDetails(String businessDetails) { this.businessDetails = businessDetails; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public OpeningBalanceNature getOpeningBalanceNature() { return openingBalanceNature; }
    public void setOpeningBalanceNature(OpeningBalanceNature openingBalanceNature) {
        this.openingBalanceNature = openingBalanceNature;
    }
    public BigDecimal getTotalPendingAmount() { return totalPendingAmount; }
    public void setTotalPendingAmount(BigDecimal totalPendingAmount) { this.totalPendingAmount = totalPendingAmount; }
}
