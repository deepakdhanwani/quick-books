package com.quickbooks.dto.settings;

public class DemoDataGenerationResult {

    private Long subscriberId;
    private String businessName;
    private String businessTypeName;
    private String ownerName;
    private String phone;
    private String loginPin;
    private int customersCreated;
    private int vendorsCreated;
    private int productsCreated;
    private int purchasesCreated;
    private int salesCreated;
    private long totalCustomers;
    private long totalVendors;
    private long totalProducts;
    private long totalPurchases;
    private long totalSales;

    public Long getSubscriberId() { return subscriberId; }
    public void setSubscriberId(Long subscriberId) { this.subscriberId = subscriberId; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getBusinessTypeName() { return businessTypeName; }
    public void setBusinessTypeName(String businessTypeName) { this.businessTypeName = businessTypeName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public int getCustomersCreated() { return customersCreated; }
    public void setCustomersCreated(int customersCreated) { this.customersCreated = customersCreated; }
    public int getVendorsCreated() { return vendorsCreated; }
    public void setVendorsCreated(int vendorsCreated) { this.vendorsCreated = vendorsCreated; }
    public int getProductsCreated() { return productsCreated; }
    public void setProductsCreated(int productsCreated) { this.productsCreated = productsCreated; }
    public int getPurchasesCreated() { return purchasesCreated; }
    public void setPurchasesCreated(int purchasesCreated) { this.purchasesCreated = purchasesCreated; }
    public int getSalesCreated() { return salesCreated; }
    public void setSalesCreated(int salesCreated) { this.salesCreated = salesCreated; }
    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }
    public long getTotalVendors() { return totalVendors; }
    public void setTotalVendors(long totalVendors) { this.totalVendors = totalVendors; }
    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }
    public long getTotalPurchases() { return totalPurchases; }
    public void setTotalPurchases(long totalPurchases) { this.totalPurchases = totalPurchases; }
    public long getTotalSales() { return totalSales; }
    public void setTotalSales(long totalSales) { this.totalSales = totalSales; }
}
