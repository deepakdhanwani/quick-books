package com.quickbooks.service;

import com.quickbooks.dto.subscriberuser.ModuleCrudPermissions;
import com.quickbooks.dto.subscriberuser.StaffPermissionsRequest;
import com.quickbooks.entity.SubscriberUser;
import com.quickbooks.entity.SubscriberUserCompany;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.repository.SubscriberUserCompanyRepository;
import com.quickbooks.repository.SubscriberUserRepository;
import com.quickbooks.security.StaffPermissions;
import com.quickbooks.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Enforces module permissions for team (staff) users only.
 * The subscriber owner account bypasses every check in this service.
 */
@Service
public class StaffAccessService {

    private final SubscriberUserRepository subscriberUserRepository;
    private final SubscriberUserCompanyRepository subscriberUserCompanyRepository;
    private final CompanyRepository companyRepository;

    public StaffAccessService(SubscriberUserRepository subscriberUserRepository,
                              SubscriberUserCompanyRepository subscriberUserCompanyRepository,
                              CompanyRepository companyRepository) {
        this.subscriberUserRepository = subscriberUserRepository;
        this.subscriberUserCompanyRepository = subscriberUserCompanyRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public StaffPermissions loadForStaff(Long subscriberId, Long staffUserId) {
        SubscriberUser user = subscriberUserRepository.findByIdAndSubscriberId(staffUserId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team user not found"));
        List<Long> companyIds = subscriberUserCompanyRepository.findBySubscriberUserIdOrderByCompanyIdAsc(staffUserId).stream()
                .map(SubscriberUserCompany::getCompanyId)
                .toList();
        return StaffPermissions.from(user, companyIds);
    }

    @Transactional(readOnly = true)
    public List<Long> listAccessibleCompanyIds(UserPrincipal principal) {
        if (principal.isOwner()) {
            return companyRepository.findBySubscriberIdAndActiveTrueOrderByNameAsc(principal.getSubscriberId()).stream()
                    .map(company -> company.getId())
                    .toList();
        }
        return resolve(principal).getCompanyIds().stream().sorted().toList();
    }

    @Transactional
    public void applyPermissions(Long subscriberId, SubscriberUser user, StaffPermissionsRequest request) {
        Set<Long> companyIds = normalizeCompanyIds(subscriberId, request.getCompanyIds());
        user.setCanViewDashboard(request.isViewDashboard());
        user.setCanViewReports(request.isViewReports());
        applyCompanyCrud(user, request.getCompanies());
        applyModuleCrud(user, request.getCustomers(), request.getVendors(), request.getSales(),
                request.getPurchases(), request.getProducts(), request.getReminders());

        subscriberUserCompanyRepository.deleteBySubscriberUserId(user.getId());
        for (Long companyId : companyIds) {
            subscriberUserCompanyRepository.save(new SubscriberUserCompany(user.getId(), companyId));
        }
    }

    public StaffPermissions resolve(UserPrincipal principal) {
        if (principal.isOwner()) {
            return StaffPermissions.ownerAll();
        }
        StaffPermissions permissions = principal.getStaffPermissions();
        if (permissions == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff permissions are not available");
        }
        return permissions;
    }

    public void requireCompanyAccess(UserPrincipal principal) {
        if (principal.isOwner()) {
            return;
        }
        StaffPermissions permissions = resolve(principal);
        Long companyId = principal.getCompanyId();
        if (companyId == null || !permissions.canAccessCompany(companyId)) {
            throw forbidden("access this company");
        }
    }

    public void requireViewDashboard(UserPrincipal principal) {
        requireFlag(principal, resolve(principal).isViewDashboard(), "view the dashboard");
    }

    public void requireViewReports(UserPrincipal principal) {
        requireFlag(principal, resolve(principal).isViewReports(), "view reports");
    }

    public void requireCompanyCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getCompanies(), "create companies");
    }

    public void requireCustomerView(UserPrincipal principal) {
        requireCrudView(principal, resolve(principal).getCustomers(), "view customers");
    }

    public void requireCustomerCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getCustomers(), "create customers");
    }

    public void requireCustomerEdit(UserPrincipal principal) {
        requireCrudEdit(principal, resolve(principal).getCustomers(), "edit customers");
    }

    public void requireCustomerDelete(UserPrincipal principal) {
        requireCrudDelete(principal, resolve(principal).getCustomers(), "delete customers");
    }

    public void requireCustomerPicker(UserPrincipal principal) {
        if (principal.isOwner()) {
            return;
        }
        requireCompanyAccess(principal);
        ModuleCrudPermissions customers = resolve(principal).getCustomers();
        ModuleCrudPermissions sales = resolve(principal).getSales();
        ModuleCrudPermissions reminders = resolve(principal).getReminders();
        if (!customers.getView() && !customers.getCreate() && !sales.getCreate() && !reminders.getCreate()) {
            throw forbidden("access customers");
        }
    }

    public void requireVendorView(UserPrincipal principal) {
        requireCrudView(principal, resolve(principal).getVendors(), "view vendors");
    }

    public void requireVendorCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getVendors(), "create vendors");
    }

    public void requireVendorEdit(UserPrincipal principal) {
        requireCrudEdit(principal, resolve(principal).getVendors(), "edit vendors");
    }

    public void requireVendorDelete(UserPrincipal principal) {
        requireCrudDelete(principal, resolve(principal).getVendors(), "delete vendors");
    }

    public void requireVendorPicker(UserPrincipal principal) {
        if (principal.isOwner()) {
            return;
        }
        requireCompanyAccess(principal);
        ModuleCrudPermissions vendors = resolve(principal).getVendors();
        ModuleCrudPermissions purchases = resolve(principal).getPurchases();
        if (!vendors.getView() && !vendors.getCreate() && !purchases.getCreate()) {
            throw forbidden("access vendors");
        }
    }

    public void requireSaleView(UserPrincipal principal) {
        requireCrudView(principal, resolve(principal).getSales(), "view sales");
    }

    public void requireSaleCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getSales(), "create sales");
    }

    public void requireSaleEdit(UserPrincipal principal) {
        requireCrudEdit(principal, resolve(principal).getSales(), "edit sales");
    }

    public void requireSaleDelete(UserPrincipal principal) {
        requireCrudDelete(principal, resolve(principal).getSales(), "delete sales");
    }

    public void requirePurchaseView(UserPrincipal principal) {
        requireCrudView(principal, resolve(principal).getPurchases(), "view purchases");
    }

    public void requirePurchaseCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getPurchases(), "create purchases");
    }

    public void requirePurchaseEdit(UserPrincipal principal) {
        requireCrudEdit(principal, resolve(principal).getPurchases(), "edit purchases");
    }

    public void requirePurchaseDelete(UserPrincipal principal) {
        requireCrudDelete(principal, resolve(principal).getPurchases(), "delete purchases");
    }

    public void requireProductView(UserPrincipal principal) {
        requireCrudView(principal, resolve(principal).getProducts(), "view products");
    }

    public void requireProductCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getProducts(), "create products");
    }

    public void requireProductEdit(UserPrincipal principal) {
        requireCrudEdit(principal, resolve(principal).getProducts(), "edit products");
    }

    public void requireProductDelete(UserPrincipal principal) {
        requireCrudDelete(principal, resolve(principal).getProducts(), "delete products");
    }

    public void requireProductPicker(UserPrincipal principal) {
        if (principal.isOwner()) {
            return;
        }
        requireCompanyAccess(principal);
        ModuleCrudPermissions products = resolve(principal).getProducts();
        ModuleCrudPermissions sales = resolve(principal).getSales();
        ModuleCrudPermissions purchases = resolve(principal).getPurchases();
        if (!products.getView() && !products.getCreate() && !sales.getCreate() && !purchases.getCreate()) {
            throw forbidden("access products");
        }
    }

    public void requireReminderView(UserPrincipal principal) {
        requireCrudView(principal, resolve(principal).getReminders(), "view reminders");
    }

    public void requireReminderCreate(UserPrincipal principal) {
        requireCrudCreate(principal, resolve(principal).getReminders(), "create reminders");
    }

    public void requireReminderEdit(UserPrincipal principal) {
        requireCrudEdit(principal, resolve(principal).getReminders(), "edit reminders");
    }

    public void requireReminderDelete(UserPrincipal principal) {
        requireCrudDelete(principal, resolve(principal).getReminders(), "delete reminders");
    }

    public void requireViewDashboardReminders(UserPrincipal principal) {
        if (principal.isOwner()) {
            return;
        }
        requireCompanyAccess(principal);
        StaffPermissions permissions = resolve(principal);
        if (!permissions.getReminders().getView() && !permissions.isViewDashboard()) {
            throw forbidden("view reminders");
        }
    }

    private void requireFlag(UserPrincipal principal, boolean allowed, String action) {
        if (principal.isOwner()) {
            return;
        }
        requireCompanyAccess(principal);
        if (!allowed) {
            throw forbidden(action);
        }
    }

    private void requireCrudView(UserPrincipal principal, ModuleCrudPermissions crud, String action) {
        requireCrud(principal, crud.getView(), action);
    }

    private void requireCrudCreate(UserPrincipal principal, ModuleCrudPermissions crud, String action) {
        requireCrud(principal, crud.getCreate(), action);
    }

    private void requireCrudEdit(UserPrincipal principal, ModuleCrudPermissions crud, String action) {
        requireCrud(principal, crud.getEdit(), action);
    }

    private void requireCrudDelete(UserPrincipal principal, ModuleCrudPermissions crud, String action) {
        requireCrud(principal, crud.getDelete(), action);
    }

    private void requireCrud(UserPrincipal principal, boolean allowed, String action) {
        if (principal.isOwner()) {
            return;
        }
        requireCompanyAccess(principal);
        if (!allowed) {
            throw forbidden(action);
        }
    }

    private void applyCompanyCrud(SubscriberUser user, ModuleCrudPermissions companies) {
        ModuleCrudPermissions source = companies != null ? companies : ModuleCrudPermissions.none();
        user.setCompaniesCreate(source.getCreate());
        user.setCompaniesEdit(source.getEdit());
        user.setCompaniesDelete(source.getDelete());
    }

    private void applyModuleCrud(SubscriberUser user,
                                 ModuleCrudPermissions customers,
                                 ModuleCrudPermissions vendors,
                                 ModuleCrudPermissions sales,
                                 ModuleCrudPermissions purchases,
                                 ModuleCrudPermissions products,
                                 ModuleCrudPermissions reminders) {
        applyCustomers(user, customers);
        applyVendors(user, vendors);
        applySales(user, sales);
        applyPurchases(user, purchases);
        applyProducts(user, products);
        applyReminders(user, reminders);
    }

    private void applyCustomers(SubscriberUser user, ModuleCrudPermissions crud) {
        ModuleCrudPermissions source = crud != null ? crud : ModuleCrudPermissions.none();
        user.setCustomersView(source.getView());
        user.setCustomersCreate(source.getCreate());
        user.setCustomersEdit(source.getEdit());
        user.setCustomersDelete(source.getDelete());
    }

    private void applyVendors(SubscriberUser user, ModuleCrudPermissions crud) {
        ModuleCrudPermissions source = crud != null ? crud : ModuleCrudPermissions.none();
        user.setVendorsView(source.getView());
        user.setVendorsCreate(source.getCreate());
        user.setVendorsEdit(source.getEdit());
        user.setVendorsDelete(source.getDelete());
    }

    private void applySales(SubscriberUser user, ModuleCrudPermissions crud) {
        ModuleCrudPermissions source = crud != null ? crud : ModuleCrudPermissions.none();
        user.setSalesView(source.getView());
        user.setSalesCreate(source.getCreate());
        user.setSalesEdit(source.getEdit());
        user.setSalesDelete(source.getDelete());
    }

    private void applyPurchases(SubscriberUser user, ModuleCrudPermissions crud) {
        ModuleCrudPermissions source = crud != null ? crud : ModuleCrudPermissions.none();
        user.setPurchasesView(source.getView());
        user.setPurchasesCreate(source.getCreate());
        user.setPurchasesEdit(source.getEdit());
        user.setPurchasesDelete(source.getDelete());
    }

    private void applyProducts(SubscriberUser user, ModuleCrudPermissions crud) {
        ModuleCrudPermissions source = crud != null ? crud : ModuleCrudPermissions.none();
        user.setProductsView(source.getView());
        user.setProductsCreate(source.getCreate());
        user.setProductsEdit(source.getEdit());
        user.setProductsDelete(source.getDelete());
    }

    private void applyReminders(SubscriberUser user, ModuleCrudPermissions crud) {
        ModuleCrudPermissions source = crud != null ? crud : ModuleCrudPermissions.none();
        user.setRemindersView(source.getView());
        user.setRemindersCreate(source.getCreate());
        user.setRemindersEdit(source.getEdit());
        user.setRemindersDelete(source.getDelete());
    }

    private Set<Long> normalizeCompanyIds(Long subscriberId, List<Long> companyIds) {
        if (companyIds == null || companyIds.isEmpty()) {
            return Set.of();
        }
        Set<Long> normalized = new LinkedHashSet<>();
        for (Long companyId : companyIds) {
            if (companyId == null) {
                continue;
            }
            boolean valid = companyRepository.findByIdAndSubscriberIdAndActiveTrue(companyId, subscriberId).isPresent();
            if (!valid) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid company selection");
            }
            normalized.add(companyId);
        }
        return normalized;
    }

    private ResponseStatusException forbidden(String action) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to " + action);
    }
}
