package com.quickbooks.security;

import com.quickbooks.dto.subscriberuser.ModuleCrudPermissions;
import com.quickbooks.entity.SubscriberUser;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class StaffPermissions {

    private final Set<Long> companyIds;
    private final boolean viewDashboard;
    private final boolean viewReports;
    private final ModuleCrudPermissions companies;
    private final ModuleCrudPermissions customers;
    private final ModuleCrudPermissions vendors;
    private final ModuleCrudPermissions sales;
    private final ModuleCrudPermissions purchases;
    private final ModuleCrudPermissions products;
    private final ModuleCrudPermissions reminders;

    public StaffPermissions(Set<Long> companyIds,
                            boolean viewDashboard,
                            boolean viewReports,
                            ModuleCrudPermissions companies,
                            ModuleCrudPermissions customers,
                            ModuleCrudPermissions vendors,
                            ModuleCrudPermissions sales,
                            ModuleCrudPermissions purchases,
                            ModuleCrudPermissions products,
                            ModuleCrudPermissions reminders) {
        this.companyIds = companyIds;
        this.viewDashboard = viewDashboard;
        this.viewReports = viewReports;
        this.companies = companies;
        this.customers = customers;
        this.vendors = vendors;
        this.sales = sales;
        this.purchases = purchases;
        this.products = products;
        this.reminders = reminders;
    }

    public static StaffPermissions ownerAll() {
        return new StaffPermissions(
                Set.of(),
                true,
                true,
                companyCrudFull(),
                ModuleCrudPermissions.full(),
                ModuleCrudPermissions.full(),
                ModuleCrudPermissions.full(),
                ModuleCrudPermissions.full(),
                ModuleCrudPermissions.full(),
                ModuleCrudPermissions.full()
        );
    }

    public static StaffPermissions from(SubscriberUser user, List<Long> companyIds) {
        return new StaffPermissions(
                new LinkedHashSet<>(companyIds),
                user.isCanViewDashboard(),
                user.isCanViewReports(),
                companyCrud(user.isCompaniesCreate(), user.isCompaniesEdit(), user.isCompaniesDelete()),
                moduleCrud(user.isCustomersView(), user.isCustomersCreate(), user.isCustomersEdit(), user.isCustomersDelete()),
                moduleCrud(user.isVendorsView(), user.isVendorsCreate(), user.isVendorsEdit(), user.isVendorsDelete()),
                moduleCrud(user.isSalesView(), user.isSalesCreate(), user.isSalesEdit(), user.isSalesDelete()),
                moduleCrud(user.isPurchasesView(), user.isPurchasesCreate(), user.isPurchasesEdit(), user.isPurchasesDelete()),
                moduleCrud(user.isProductsView(), user.isProductsCreate(), user.isProductsEdit(), user.isProductsDelete()),
                moduleCrud(user.isRemindersView(), user.isRemindersCreate(), user.isRemindersEdit(), user.isRemindersDelete())
        );
    }

    public Set<Long> getCompanyIds() { return companyIds; }
    public boolean isViewDashboard() { return viewDashboard; }
    public boolean isViewReports() { return viewReports; }
    public ModuleCrudPermissions getCompanies() { return companies; }
    public ModuleCrudPermissions getCustomers() { return customers; }
    public ModuleCrudPermissions getVendors() { return vendors; }
    public ModuleCrudPermissions getSales() { return sales; }
    public ModuleCrudPermissions getPurchases() { return purchases; }
    public ModuleCrudPermissions getProducts() { return products; }
    public ModuleCrudPermissions getReminders() { return reminders; }

    public boolean canAccessCompany(Long companyId) {
        return companyId != null && companyIds.contains(companyId);
    }

    private static ModuleCrudPermissions companyCrud(boolean create, boolean edit, boolean delete) {
        ModuleCrudPermissions permissions = new ModuleCrudPermissions();
        permissions.setCreate(create);
        permissions.setEdit(edit);
        permissions.setDelete(delete);
        return permissions;
    }

    private static ModuleCrudPermissions companyCrudFull() {
        ModuleCrudPermissions permissions = new ModuleCrudPermissions();
        permissions.setCreate(true);
        permissions.setEdit(true);
        permissions.setDelete(true);
        return permissions;
    }

    private static ModuleCrudPermissions moduleCrud(boolean view, boolean create, boolean edit, boolean delete) {
        ModuleCrudPermissions permissions = new ModuleCrudPermissions();
        permissions.setView(view);
        permissions.setCreate(create);
        permissions.setEdit(edit);
        permissions.setDelete(delete);
        return permissions;
    }
}
