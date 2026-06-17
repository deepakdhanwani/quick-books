package com.quickbooks.dto.subscriberuser;

import com.quickbooks.security.StaffPermissions;

import java.util.ArrayList;
import java.util.List;

public class StaffPermissionsResponse {

    private List<Long> companyIds = new ArrayList<>();
    private boolean viewDashboard;
    private boolean viewReports;
    private ModuleCrudPermissions companies = ModuleCrudPermissions.none();
    private ModuleCrudPermissions customers = ModuleCrudPermissions.none();
    private ModuleCrudPermissions vendors = ModuleCrudPermissions.none();
    private ModuleCrudPermissions sales = ModuleCrudPermissions.none();
    private ModuleCrudPermissions purchases = ModuleCrudPermissions.none();
    private ModuleCrudPermissions products = ModuleCrudPermissions.none();
    private ModuleCrudPermissions reminders = ModuleCrudPermissions.none();

    public static StaffPermissionsResponse from(StaffPermissions permissions) {
        StaffPermissionsResponse response = new StaffPermissionsResponse();
        response.setCompanyIds(new ArrayList<>(permissions.getCompanyIds()));
        response.setViewDashboard(permissions.isViewDashboard());
        response.setViewReports(permissions.isViewReports());
        response.setCompanies(copy(permissions.getCompanies()));
        response.setCustomers(copy(permissions.getCustomers()));
        response.setVendors(copy(permissions.getVendors()));
        response.setSales(copy(permissions.getSales()));
        response.setPurchases(copy(permissions.getPurchases()));
        response.setProducts(copy(permissions.getProducts()));
        response.setReminders(copy(permissions.getReminders()));
        return response;
    }

    public static StaffPermissionsResponse ownerDefaults() {
        return from(StaffPermissions.ownerAll());
    }

    private static ModuleCrudPermissions copy(ModuleCrudPermissions source) {
        ModuleCrudPermissions target = new ModuleCrudPermissions();
        target.setView(source.getView());
        target.setCreate(source.getCreate());
        target.setEdit(source.getEdit());
        target.setDelete(source.getDelete());
        return target;
    }

    public List<Long> getCompanyIds() { return companyIds; }
    public void setCompanyIds(List<Long> companyIds) { this.companyIds = companyIds; }
    public boolean isViewDashboard() { return viewDashboard; }
    public void setViewDashboard(boolean viewDashboard) { this.viewDashboard = viewDashboard; }
    public boolean isViewReports() { return viewReports; }
    public void setViewReports(boolean viewReports) { this.viewReports = viewReports; }
    public ModuleCrudPermissions getCompanies() { return companies; }
    public void setCompanies(ModuleCrudPermissions companies) { this.companies = companies; }
    public ModuleCrudPermissions getCustomers() { return customers; }
    public void setCustomers(ModuleCrudPermissions customers) { this.customers = customers; }
    public ModuleCrudPermissions getVendors() { return vendors; }
    public void setVendors(ModuleCrudPermissions vendors) { this.vendors = vendors; }
    public ModuleCrudPermissions getSales() { return sales; }
    public void setSales(ModuleCrudPermissions sales) { this.sales = sales; }
    public ModuleCrudPermissions getPurchases() { return purchases; }
    public void setPurchases(ModuleCrudPermissions purchases) { this.purchases = purchases; }
    public ModuleCrudPermissions getProducts() { return products; }
    public void setProducts(ModuleCrudPermissions products) { this.products = products; }
    public ModuleCrudPermissions getReminders() { return reminders; }
    public void setReminders(ModuleCrudPermissions reminders) { this.reminders = reminders; }
}
