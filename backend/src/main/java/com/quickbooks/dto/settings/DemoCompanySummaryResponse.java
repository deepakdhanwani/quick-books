package com.quickbooks.dto.settings;

public class DemoCompanySummaryResponse {

    private Long id;
    private String name;
    private String alias;
    private long customerCount;
    private long vendorCount;
    private long productCount;
    private long saleCount;
    private long purchaseCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public long getCustomerCount() { return customerCount; }
    public void setCustomerCount(long customerCount) { this.customerCount = customerCount; }
    public long getVendorCount() { return vendorCount; }
    public void setVendorCount(long vendorCount) { this.vendorCount = vendorCount; }
    public long getProductCount() { return productCount; }
    public void setProductCount(long productCount) { this.productCount = productCount; }
    public long getSaleCount() { return saleCount; }
    public void setSaleCount(long saleCount) { this.saleCount = saleCount; }
    public long getPurchaseCount() { return purchaseCount; }
    public void setPurchaseCount(long purchaseCount) { this.purchaseCount = purchaseCount; }
}
