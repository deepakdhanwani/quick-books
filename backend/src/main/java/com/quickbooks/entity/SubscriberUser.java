package com.quickbooks.entity;

import com.quickbooks.entity.enums.AppFontSize;
import com.quickbooks.entity.enums.AppTheme;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "subscriber_users")
public class SubscriberUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private Subscriber subscriber;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "login_pin_hash", nullable = false)
    private String loginPinHash;

    @Column(name = "login_pin", nullable = false, length = 20)
    private String loginPin;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_mode", nullable = false)
    private AppTheme themeMode = AppTheme.DARK;

    @Enumerated(EnumType.STRING)
    @Column(name = "font_size", nullable = false)
    private AppFontSize fontSize = AppFontSize.SMALL;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "can_view_dashboard", nullable = false)
    private boolean canViewDashboard = true;

    @Column(name = "can_view_reports", nullable = false)
    private boolean canViewReports;

    @Column(name = "companies_create", nullable = false)
    private boolean companiesCreate;

    @Column(name = "companies_edit", nullable = false)
    private boolean companiesEdit;

    @Column(name = "companies_delete", nullable = false)
    private boolean companiesDelete;

    @Column(name = "customers_view", nullable = false)
    private boolean customersView;

    @Column(name = "customers_create", nullable = false)
    private boolean customersCreate;

    @Column(name = "customers_edit", nullable = false)
    private boolean customersEdit;

    @Column(name = "customers_delete", nullable = false)
    private boolean customersDelete;

    @Column(name = "vendors_view", nullable = false)
    private boolean vendorsView;

    @Column(name = "vendors_create", nullable = false)
    private boolean vendorsCreate;

    @Column(name = "vendors_edit", nullable = false)
    private boolean vendorsEdit;

    @Column(name = "vendors_delete", nullable = false)
    private boolean vendorsDelete;

    @Column(name = "sales_view", nullable = false)
    private boolean salesView;

    @Column(name = "sales_create", nullable = false)
    private boolean salesCreate;

    @Column(name = "sales_edit", nullable = false)
    private boolean salesEdit;

    @Column(name = "sales_delete", nullable = false)
    private boolean salesDelete;

    @Column(name = "purchases_view", nullable = false)
    private boolean purchasesView;

    @Column(name = "purchases_create", nullable = false)
    private boolean purchasesCreate;

    @Column(name = "purchases_edit", nullable = false)
    private boolean purchasesEdit;

    @Column(name = "purchases_delete", nullable = false)
    private boolean purchasesDelete;

    @Column(name = "products_view", nullable = false)
    private boolean productsView;

    @Column(name = "products_create", nullable = false)
    private boolean productsCreate;

    @Column(name = "products_edit", nullable = false)
    private boolean productsEdit;

    @Column(name = "products_delete", nullable = false)
    private boolean productsDelete;

    @Column(name = "reminders_view", nullable = false)
    private boolean remindersView;

    @Column(name = "reminders_create", nullable = false)
    private boolean remindersCreate;

    @Column(name = "reminders_edit", nullable = false)
    private boolean remindersEdit;

    @Column(name = "reminders_delete", nullable = false)
    private boolean remindersDelete;

    public Long getId() { return id; }
    public Subscriber getSubscriber() { return subscriber; }
    public void setSubscriber(Subscriber subscriber) { this.subscriber = subscriber; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLoginPinHash() { return loginPinHash; }
    public void setLoginPinHash(String loginPinHash) { this.loginPinHash = loginPinHash; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public AppTheme getThemeMode() { return themeMode; }
    public void setThemeMode(AppTheme themeMode) { this.themeMode = themeMode; }
    public AppFontSize getFontSize() { return fontSize; }
    public void setFontSize(AppFontSize fontSize) { this.fontSize = fontSize; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public boolean isCanViewDashboard() { return canViewDashboard; }
    public void setCanViewDashboard(boolean canViewDashboard) { this.canViewDashboard = canViewDashboard; }
    public boolean isCanViewReports() { return canViewReports; }
    public void setCanViewReports(boolean canViewReports) { this.canViewReports = canViewReports; }
    public boolean isCompaniesCreate() { return companiesCreate; }
    public void setCompaniesCreate(boolean companiesCreate) { this.companiesCreate = companiesCreate; }
    public boolean isCompaniesEdit() { return companiesEdit; }
    public void setCompaniesEdit(boolean companiesEdit) { this.companiesEdit = companiesEdit; }
    public boolean isCompaniesDelete() { return companiesDelete; }
    public void setCompaniesDelete(boolean companiesDelete) { this.companiesDelete = companiesDelete; }
    public boolean isCustomersView() { return customersView; }
    public void setCustomersView(boolean customersView) { this.customersView = customersView; }
    public boolean isCustomersCreate() { return customersCreate; }
    public void setCustomersCreate(boolean customersCreate) { this.customersCreate = customersCreate; }
    public boolean isCustomersEdit() { return customersEdit; }
    public void setCustomersEdit(boolean customersEdit) { this.customersEdit = customersEdit; }
    public boolean isCustomersDelete() { return customersDelete; }
    public void setCustomersDelete(boolean customersDelete) { this.customersDelete = customersDelete; }
    public boolean isVendorsView() { return vendorsView; }
    public void setVendorsView(boolean vendorsView) { this.vendorsView = vendorsView; }
    public boolean isVendorsCreate() { return vendorsCreate; }
    public void setVendorsCreate(boolean vendorsCreate) { this.vendorsCreate = vendorsCreate; }
    public boolean isVendorsEdit() { return vendorsEdit; }
    public void setVendorsEdit(boolean vendorsEdit) { this.vendorsEdit = vendorsEdit; }
    public boolean isVendorsDelete() { return vendorsDelete; }
    public void setVendorsDelete(boolean vendorsDelete) { this.vendorsDelete = vendorsDelete; }
    public boolean isSalesView() { return salesView; }
    public void setSalesView(boolean salesView) { this.salesView = salesView; }
    public boolean isSalesCreate() { return salesCreate; }
    public void setSalesCreate(boolean salesCreate) { this.salesCreate = salesCreate; }
    public boolean isSalesEdit() { return salesEdit; }
    public void setSalesEdit(boolean salesEdit) { this.salesEdit = salesEdit; }
    public boolean isSalesDelete() { return salesDelete; }
    public void setSalesDelete(boolean salesDelete) { this.salesDelete = salesDelete; }
    public boolean isPurchasesView() { return purchasesView; }
    public void setPurchasesView(boolean purchasesView) { this.purchasesView = purchasesView; }
    public boolean isPurchasesCreate() { return purchasesCreate; }
    public void setPurchasesCreate(boolean purchasesCreate) { this.purchasesCreate = purchasesCreate; }
    public boolean isPurchasesEdit() { return purchasesEdit; }
    public void setPurchasesEdit(boolean purchasesEdit) { this.purchasesEdit = purchasesEdit; }
    public boolean isPurchasesDelete() { return purchasesDelete; }
    public void setPurchasesDelete(boolean purchasesDelete) { this.purchasesDelete = purchasesDelete; }
    public boolean isProductsView() { return productsView; }
    public void setProductsView(boolean productsView) { this.productsView = productsView; }
    public boolean isProductsCreate() { return productsCreate; }
    public void setProductsCreate(boolean productsCreate) { this.productsCreate = productsCreate; }
    public boolean isProductsEdit() { return productsEdit; }
    public void setProductsEdit(boolean productsEdit) { this.productsEdit = productsEdit; }
    public boolean isProductsDelete() { return productsDelete; }
    public void setProductsDelete(boolean productsDelete) { this.productsDelete = productsDelete; }
    public boolean isRemindersView() { return remindersView; }
    public void setRemindersView(boolean remindersView) { this.remindersView = remindersView; }
    public boolean isRemindersCreate() { return remindersCreate; }
    public void setRemindersCreate(boolean remindersCreate) { this.remindersCreate = remindersCreate; }
    public boolean isRemindersEdit() { return remindersEdit; }
    public void setRemindersEdit(boolean remindersEdit) { this.remindersEdit = remindersEdit; }
    public boolean isRemindersDelete() { return remindersDelete; }
    public void setRemindersDelete(boolean remindersDelete) { this.remindersDelete = remindersDelete; }
}
