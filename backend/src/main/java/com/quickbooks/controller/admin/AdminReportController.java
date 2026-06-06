package com.quickbooks.controller.admin;

import com.quickbooks.dto.report.AdminDashboardSummaryResponse;
import com.quickbooks.dto.report.AdminReportResponse;
import com.quickbooks.service.AdminReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final AdminReportService adminReportService;

    public AdminReportController(AdminReportService adminReportService) {
        this.adminReportService = adminReportService;
    }

    @GetMapping("/summary")
    public AdminDashboardSummaryResponse summary() {
        return adminReportService.dashboardSummary();
    }

    @GetMapping("/revenue")
    public AdminReportResponse revenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) Long businessTypeId) {
        return adminReportService.revenueReport(from, to, planId, businessTypeId);
    }

    @GetMapping("/pending-subscriptions")
    public AdminReportResponse pendingSubscriptions() {
        return adminReportService.pendingSubscriptionsReport();
    }

    @GetMapping("/expiring-subscriptions")
    public AdminReportResponse expiringSubscriptions(
            @RequestParam(defaultValue = "30") int withinDays) {
        return adminReportService.expiringSubscriptionsReport(withinDays);
    }

    @GetMapping("/business-type-breakdown")
    public AdminReportResponse businessTypeBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return adminReportService.businessTypeBreakdownReport(from, to);
    }
}
