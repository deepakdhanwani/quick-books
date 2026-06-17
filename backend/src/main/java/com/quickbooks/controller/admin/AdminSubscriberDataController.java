package com.quickbooks.controller.admin;

import com.quickbooks.dto.audit.AuditLogResponse;
import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.customer.CustomerResponse;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.purchase.PurchaseResponse;
import com.quickbooks.dto.report.AdminReportResponse;
import com.quickbooks.dto.sale.SaleResponse;
import com.quickbooks.dto.subscriber.SubscriberDataSummaryResponse;
import com.quickbooks.dto.subscriberuser.SubscriberUserResponse;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.service.AdminSubscriberDataService;
import com.quickbooks.service.AdminSubscriberReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/subscribers/{subscriberId}/data")
public class AdminSubscriberDataController {

    private final AdminSubscriberDataService adminSubscriberDataService;
    private final AdminSubscriberReportService adminSubscriberReportService;

    public AdminSubscriberDataController(AdminSubscriberDataService adminSubscriberDataService,
                                         AdminSubscriberReportService adminSubscriberReportService) {
        this.adminSubscriberDataService = adminSubscriberDataService;
        this.adminSubscriberReportService = adminSubscriberReportService;
    }

    @GetMapping("/summary")
    public SubscriberDataSummaryResponse summary(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId) {
        return adminSubscriberDataService.getSummary(subscriberId, companyId);
    }

    @GetMapping("/customers")
    public PageResponse<CustomerResponse> customers(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return adminSubscriberDataService.listCustomers(subscriberId, companyId, page, size, active, search);
    }

    @GetMapping("/vendors")
    public PageResponse<VendorResponse> vendors(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return adminSubscriberDataService.listVendors(subscriberId, companyId, page, size, active, search);
    }

    @GetMapping("/products")
    public PageResponse<ProductResponse> products(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return adminSubscriberDataService.listProducts(subscriberId, companyId, page, size, active, search);
    }

    @GetMapping("/sales")
    public PageResponse<SaleResponse> sales(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentListFilter paymentFilter,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return adminSubscriberDataService.listSales(
                subscriberId, companyId, page, size, search, paymentFilter, fromDate, toDate);
    }

    @GetMapping("/purchases")
    public PageResponse<PurchaseResponse> purchases(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentListFilter paymentFilter,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return adminSubscriberDataService.listPurchases(
                subscriberId, companyId, page, size, search, paymentFilter, fromDate, toDate);
    }

    @GetMapping("/users")
    public List<SubscriberUserResponse> teamUsers(@PathVariable Long subscriberId) {
        return adminSubscriberDataService.listTeamUsers(subscriberId);
    }

    @GetMapping("/audit-logs")
    public PageResponse<AuditLogResponse> auditLogs(
            @PathVariable Long subscriberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminSubscriberDataService.listAuditLogs(subscriberId, page, size);
    }

    @GetMapping("/reports/sales")
    public AdminReportResponse salesReport(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return adminSubscriberReportService.salesReport(subscriberId, companyId, from, to);
    }

    @GetMapping("/reports/purchases")
    public AdminReportResponse purchasesReport(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return adminSubscriberReportService.purchasesReport(subscriberId, companyId, from, to);
    }

    @GetMapping("/reports/summary")
    public AdminReportResponse businessSummaryReport(
            @PathVariable Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return adminSubscriberReportService.businessSummaryReport(subscriberId, companyId, from, to);
    }
}
