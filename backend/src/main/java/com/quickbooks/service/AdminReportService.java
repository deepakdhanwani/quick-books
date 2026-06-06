package com.quickbooks.service;

import com.quickbooks.dto.report.AdminDashboardSummaryResponse;
import com.quickbooks.dto.report.AdminReportResponse;
import com.quickbooks.dto.report.ChartPointDto;
import com.quickbooks.dto.report.ReportColumnDto;
import com.quickbooks.dto.report.ReportSummaryItemDto;
import com.quickbooks.entity.BusinessType;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberSubscriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminReportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private final SubscriberRepository subscriberRepository;
    private final SubscriberSubscriptionRepository subscriberSubscriptionRepository;

    public AdminReportService(SubscriberRepository subscriberRepository,
                              SubscriberSubscriptionRepository subscriberSubscriptionRepository) {
        this.subscriberRepository = subscriberRepository;
        this.subscriberSubscriptionRepository = subscriberSubscriptionRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse dashboardSummary() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime monthStart = today.withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime monthEnd = today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        AdminDashboardSummaryResponse response = new AdminDashboardSummaryResponse();
        response.setTotalSubscribers(subscriberRepository.countByActiveTrue());
        response.setActiveSubscriptions(subscriberSubscriptionRepository.countByStatus(SubscriptionRecordStatus.ACTIVE));
        response.setPendingSubscriptions(subscriberRepository.countBySubscriptionStatus(SubscriptionStatus.NONE));
        response.setExpiringSoon(subscriberSubscriptionRepository
                .findExpiringBetween(today, today.plusDays(30))
                .size());
        response.setRevenueMtd(subscriberSubscriptionRepository.sumTotalAmountBetween(monthStart, monthEnd));
        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse revenueReport(LocalDate from, LocalDate to, Long planId, Long businessTypeId) {
        DateRange range = resolveRange(from, to);
        List<SubscriberSubscription> records = subscriberSubscriptionRepository.findRevenueRecords(
                range.start(), range.endExclusive(), planId, businessTypeId);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("REVENUE");
        response.setTitle("Revenue Report");
        response.getFilters().put("From", formatDate(range.from()));
        response.getFilters().put("To", formatDate(range.to()));
        if (planId != null) {
            response.getFilters().put("Plan ID", String.valueOf(planId));
        }
        if (businessTypeId != null) {
            response.getFilters().put("Business Type ID", String.valueOf(businessTypeId));
        }

        BigDecimal totalRevenue = records.stream()
                .map(SubscriberSubscription::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax = records.stream()
                .map(SubscriberSubscription::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        response.getSummary().add(new ReportSummaryItemDto("Total Revenue", formatMoney(totalRevenue)));
        response.getSummary().add(new ReportSummaryItemDto("Total Tax", formatMoney(totalTax)));
        response.getSummary().add(new ReportSummaryItemDto("Transactions", String.valueOf(records.size())));

        response.getColumns().add(new ReportColumnDto("date", "Date", "left"));
        response.getColumns().add(new ReportColumnDto("subscriber", "Subscriber", "left"));
        response.getColumns().add(new ReportColumnDto("plan", "Plan", "left"));
        response.getColumns().add(new ReportColumnDto("businessType", "Business Type", "left"));
        response.getColumns().add(new ReportColumnDto("tax", "Tax", "right"));
        response.getColumns().add(new ReportColumnDto("total", "Total", "right"));

        for (SubscriberSubscription record : records) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("date", formatDate(record.getCreatedAt().toLocalDate()));
            row.put("subscriber", record.getSubscriber().getBusinessName());
            row.put("plan", record.getPlan().getName());
            row.put("businessType", businessTypeName(record.getSubscriber()));
            row.put("tax", formatMoney(record.getTaxAmount()));
            row.put("total", formatMoney(record.getTotalAmount()));
            response.getRows().add(row);
        }

        Map<YearMonth, BigDecimal> monthlyTotals = records.stream()
                .collect(Collectors.groupingBy(
                        record -> YearMonth.from(record.getCreatedAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate()),
                        Collectors.mapping(SubscriberSubscription::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        monthlyTotals.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> response.getChartData().add(
                        new ChartPointDto(entry.getKey().format(MONTH_FORMAT), entry.getValue())
                ));

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse pendingSubscriptionsReport() {
        List<Subscriber> subscribers = subscriberRepository
                .findBySubscriptionStatusOrderByBusinessNameAsc(SubscriptionStatus.NONE);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("PENDING");
        response.setTitle("Pending Subscriptions");
        response.getSummary().add(new ReportSummaryItemDto("Pending Subscribers", String.valueOf(subscribers.size())));

        response.getColumns().add(new ReportColumnDto("businessName", "Business", "left"));
        response.getColumns().add(new ReportColumnDto("ownerName", "Owner", "left"));
        response.getColumns().add(new ReportColumnDto("phone", "Phone", "left"));
        response.getColumns().add(new ReportColumnDto("businessType", "Business Type", "left"));
        response.getColumns().add(new ReportColumnDto("createdAt", "Registered", "left"));

        Map<String, Long> byBusinessType = new LinkedHashMap<>();

        for (Subscriber subscriber : subscribers) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("businessName", subscriber.getBusinessName());
            row.put("ownerName", subscriber.getOwnerName());
            row.put("phone", subscriber.getPhone());
            String businessType = businessTypeName(subscriber);
            row.put("businessType", businessType);
            row.put("createdAt", formatDate(subscriber.getCreatedAt().toLocalDate()));
            response.getRows().add(row);
            byBusinessType.merge(businessType, 1L, Long::sum);
        }

        byBusinessType.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(entry -> response.getChartData().add(
                        new ChartPointDto(entry.getKey(), BigDecimal.valueOf(entry.getValue()))
                ));

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse expiringSubscriptionsReport(int withinDays) {
        int normalizedDays = Math.min(Math.max(withinDays, 1), 365);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate until = today.plusDays(normalizedDays);

        List<SubscriberSubscription> records = subscriberSubscriptionRepository
                .findExpiringBetween(today, until);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("EXPIRING");
        response.setTitle("Expiring Subscriptions");
        response.getFilters().put("Within Days", String.valueOf(normalizedDays));
        response.getFilters().put("From", formatDate(today));
        response.getFilters().put("To", formatDate(until));
        response.getSummary().add(new ReportSummaryItemDto("Expiring Soon", String.valueOf(records.size())));

        response.getColumns().add(new ReportColumnDto("subscriber", "Subscriber", "left"));
        response.getColumns().add(new ReportColumnDto("plan", "Plan", "left"));
        response.getColumns().add(new ReportColumnDto("businessType", "Business Type", "left"));
        response.getColumns().add(new ReportColumnDto("endDate", "End Date", "left"));
        response.getColumns().add(new ReportColumnDto("daysLeft", "Days Left", "right"));

        Map<String, Long> byPlan = new LinkedHashMap<>();

        for (SubscriberSubscription record : records) {
            long daysLeft = Math.max(0, today.until(record.getEndDate()).getDays());
            Map<String, String> row = new LinkedHashMap<>();
            row.put("subscriber", record.getSubscriber().getBusinessName());
            row.put("plan", record.getPlan().getName());
            row.put("businessType", businessTypeName(record.getSubscriber()));
            row.put("endDate", formatDate(record.getEndDate()));
            row.put("daysLeft", String.valueOf(daysLeft));
            response.getRows().add(row);
            byPlan.merge(record.getPlan().getName(), 1L, Long::sum);
        }

        byPlan.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(entry -> response.getChartData().add(
                        new ChartPointDto(entry.getKey(), BigDecimal.valueOf(entry.getValue()))
                ));

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse businessTypeBreakdownReport(LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        List<SubscriberSubscription> records = subscriberSubscriptionRepository
                .findRecordsBetween(range.start(), range.endExclusive());

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("BUSINESS_TYPE");
        response.setTitle("Business Type Breakdown");
        response.getFilters().put("From", formatDate(range.from()));
        response.getFilters().put("To", formatDate(range.to()));

        Map<String, BusinessTypeStats> statsByType = new LinkedHashMap<>();

        for (Subscriber subscriber : subscriberRepository.findByActiveTrueOrderByBusinessNameAsc()) {
            String typeName = businessTypeName(subscriber);
            statsByType.computeIfAbsent(typeName, ignored -> new BusinessTypeStats(typeName));
        }

        for (SubscriberSubscription record : records) {
            String typeName = businessTypeName(record.getSubscriber());
            BusinessTypeStats stats = statsByType.computeIfAbsent(typeName, BusinessTypeStats::new);
            stats.subscriberIds.add(record.getSubscriber().getId());
            stats.transactions++;
            stats.revenue = stats.revenue.add(record.getTotalAmount());
        }

        List<BusinessTypeStats> sorted = statsByType.values().stream()
                .sorted(Comparator.comparing(BusinessTypeStats::revenue).reversed())
                .toList();

        BigDecimal totalRevenue = sorted.stream()
                .map(BusinessTypeStats::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        response.getSummary().add(new ReportSummaryItemDto("Total Revenue", formatMoney(totalRevenue)));
        response.getSummary().add(new ReportSummaryItemDto("Business Types", String.valueOf(sorted.size())));

        response.getColumns().add(new ReportColumnDto("businessType", "Business Type", "left"));
        response.getColumns().add(new ReportColumnDto("subscribers", "Paying Subscribers", "right"));
        response.getColumns().add(new ReportColumnDto("transactions", "Transactions", "right"));
        response.getColumns().add(new ReportColumnDto("revenue", "Revenue", "right"));

        for (BusinessTypeStats stats : sorted) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("businessType", stats.name);
            row.put("subscribers", String.valueOf(stats.subscriberIds.size()));
            row.put("transactions", String.valueOf(stats.transactions));
            row.put("revenue", formatMoney(stats.revenue));
            response.getRows().add(row);
            response.getChartData().add(new ChartPointDto(stats.name, stats.revenue));
        }

        return response;
    }

    private DateRange resolveRange(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate resolvedTo = to != null ? to : today;
        LocalDate resolvedFrom = from != null ? from : resolvedTo.withDayOfMonth(1);

        if (resolvedFrom.isAfter(resolvedTo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "From date must be on or before to date");
        }

        OffsetDateTime start = resolvedFrom.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime endExclusive = resolvedTo.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        return new DateRange(resolvedFrom, resolvedTo, start, endExclusive);
    }

    private String businessTypeName(Subscriber subscriber) {
        BusinessType businessType = subscriber.getBusinessType();
        return businessType != null ? businessType.getName() : "Unassigned";
    }

    private String formatDate(LocalDate date) {
        return date.format(DATE_FORMAT);
    }

    private String formatMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private record DateRange(LocalDate from, LocalDate to, OffsetDateTime start, OffsetDateTime endExclusive) {
    }

    private static class BusinessTypeStats {
        private final String name;
        private final java.util.Set<Long> subscriberIds = new java.util.HashSet<>();
        private long transactions;
        private BigDecimal revenue = BigDecimal.ZERO;

        private BusinessTypeStats(String name) {
            this.name = name;
        }

        private BigDecimal revenue() {
            return revenue;
        }
    }
}
