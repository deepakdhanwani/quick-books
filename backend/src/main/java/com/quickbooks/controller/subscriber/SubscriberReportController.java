package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.report.AdminReportResponse;
import com.quickbooks.dto.subscriber.SubscriberDashboardResponse;
import com.quickbooks.dto.subscriber.SubscriberDataSummaryResponse;
import com.quickbooks.dto.subscriber.SubscriberIntelligenceResponse;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.StaffAccessService;
import com.quickbooks.service.SubscriberIntelligenceService;
import com.quickbooks.service.SubscriberReportService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/subscriber/reports")
public class SubscriberReportController {

    private final SubscriberReportService subscriberReportService;
    private final SubscriberIntelligenceService subscriberIntelligenceService;
    private final StaffAccessService staffAccessService;

    public SubscriberReportController(SubscriberReportService subscriberReportService,
                                      SubscriberIntelligenceService subscriberIntelligenceService,
                                      StaffAccessService staffAccessService) {
        this.subscriberReportService = subscriberReportService;
        this.subscriberIntelligenceService = subscriberIntelligenceService;
        this.staffAccessService = staffAccessService;
    }

    @GetMapping("/dashboard")
    public SubscriberDashboardResponse dashboard(@AuthenticationPrincipal UserPrincipal principal) {
        staffAccessService.requireViewDashboard(principal);
        return subscriberReportService.dashboard(principal.getId(), principal.getCompanyId());
    }

    @GetMapping("/intelligence")
    public SubscriberIntelligenceResponse intelligence(@AuthenticationPrincipal UserPrincipal principal) {
        staffAccessService.requireViewDashboard(principal);
        return subscriberIntelligenceService.buildIntelligence(principal.getId(), principal.getCompanyId());
    }

    @GetMapping("/summary")
    public SubscriberDataSummaryResponse summary(@AuthenticationPrincipal UserPrincipal principal) {
        staffAccessService.requireViewDashboard(principal);
        return subscriberReportService.summary(principal.getId(), principal.getCompanyId());
    }

    @GetMapping("/sales")
    public AdminReportResponse salesReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.salesReport(principal.getId(), principal.getCompanyId(), from, to);
    }

    @GetMapping("/purchases")
    public AdminReportResponse purchasesReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.purchasesReport(principal.getId(), principal.getCompanyId(), from, to);
    }

    @GetMapping("/business-summary")
    public AdminReportResponse businessSummaryReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.businessSummaryReport(principal.getId(), principal.getCompanyId(), from, to);
    }

    @GetMapping("/receivables")
    public AdminReportResponse receivablesReport(@AuthenticationPrincipal UserPrincipal principal) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.receivablesReport(principal.getId(), principal.getCompanyId());
    }

    @GetMapping("/payables")
    public AdminReportResponse payablesReport(@AuthenticationPrincipal UserPrincipal principal) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.payablesReport(principal.getId(), principal.getCompanyId());
    }

    @GetMapping("/products")
    public AdminReportResponse productPerformanceReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.productPerformanceReport(principal.getId(), principal.getCompanyId(), from, to);
    }

    @GetMapping("/customer-trends")
    public AdminReportResponse customerTrendsReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.customerTrendsReport(principal.getId(), principal.getCompanyId(), from, to);
    }

    @GetMapping("/vendor-trends")
    public AdminReportResponse vendorTrendsReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.vendorTrendsReport(principal.getId(), principal.getCompanyId(), from, to);
    }

    @GetMapping("/orders")
    public AdminReportResponse ordersReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        staffAccessService.requireViewReports(principal);
        return subscriberReportService.ordersReport(principal.getId(), principal.getCompanyId(), from, to);
    }
}
