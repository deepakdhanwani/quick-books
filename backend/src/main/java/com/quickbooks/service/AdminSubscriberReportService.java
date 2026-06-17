package com.quickbooks.service;

import com.quickbooks.dto.report.AdminReportResponse;
import com.quickbooks.dto.report.ChartPointDto;
import com.quickbooks.dto.report.ReportColumnDto;
import com.quickbooks.dto.report.ReportSummaryItemDto;
import com.quickbooks.entity.Company;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminSubscriberReportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private final SubscriberService subscriberService;
    private final CompanyService companyService;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;

    public AdminSubscriberReportService(SubscriberService subscriberService,
                                        CompanyService companyService,
                                        SaleRepository saleRepository,
                                        PurchaseRepository purchaseRepository) {
        this.subscriberService = subscriberService;
        this.companyService = companyService;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse salesReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Company company = resolveCompany(subscriber, companyId);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_SALES");
        response.setTitle("Sales Report — " + subscriber.getBusinessName() + " / " + company.getName());
        response.getFilters().put("Company", company.getName());
        response.getFilters().put("From", formatDate(range.from()));
        response.getFilters().put("To", formatDate(range.to()));

        BigDecimal total = saleRepository.sumNetAmountBySubscriber(
                subscriberId, company.getId(), range.from(), range.to());
        BigDecimal pending = saleRepository.sumPendingAmountBySubscriber(subscriberId, company.getId());
        long count = saleRepository.findAmountsByDateRange(
                subscriberId, company.getId(), range.from(), range.to()).size();

        response.getSummary().add(new ReportSummaryItemDto("Sales in Range", String.valueOf(count)));
        response.getSummary().add(new ReportSummaryItemDto("Net Sales", formatMoney(total)));
        response.getSummary().add(new ReportSummaryItemDto("Total Pending Receivables", formatMoney(pending)));

        response.getColumns().add(new ReportColumnDto("month", "Month", "left"));
        response.getColumns().add(new ReportColumnDto("amount", "Net Sales", "right"));

        Map<YearMonth, BigDecimal> byMonth = aggregateByMonth(
                saleRepository.findAmountsByDateRange(subscriberId, company.getId(), range.from(), range.to()));

        for (Map.Entry<YearMonth, BigDecimal> entry : byMonth.entrySet()) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("month", entry.getKey().format(MONTH_FORMAT));
            row.put("amount", formatMoney(entry.getValue()));
            response.getRows().add(row);
            response.getChartData().add(new ChartPointDto(entry.getKey().format(MONTH_FORMAT), entry.getValue()));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse purchasesReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Company company = resolveCompany(subscriber, companyId);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_PURCHASES");
        response.setTitle("Purchases Report — " + subscriber.getBusinessName() + " / " + company.getName());
        response.getFilters().put("Company", company.getName());
        response.getFilters().put("From", formatDate(range.from()));
        response.getFilters().put("To", formatDate(range.to()));

        BigDecimal total = purchaseRepository.sumNetAmountBySubscriber(
                subscriberId, company.getId(), range.from(), range.to());
        BigDecimal pending = purchaseRepository.sumPendingAmountBySubscriber(subscriberId, company.getId());
        long count = purchaseRepository.findAmountsByDateRange(
                subscriberId, company.getId(), range.from(), range.to()).size();

        response.getSummary().add(new ReportSummaryItemDto("Purchases in Range", String.valueOf(count)));
        response.getSummary().add(new ReportSummaryItemDto("Net Purchases", formatMoney(total)));
        response.getSummary().add(new ReportSummaryItemDto("Total Pending Payables", formatMoney(pending)));

        response.getColumns().add(new ReportColumnDto("month", "Month", "left"));
        response.getColumns().add(new ReportColumnDto("amount", "Net Purchases", "right"));

        Map<YearMonth, BigDecimal> byMonth = aggregateByMonth(
                purchaseRepository.findAmountsByDateRange(subscriberId, company.getId(), range.from(), range.to()));

        for (Map.Entry<YearMonth, BigDecimal> entry : byMonth.entrySet()) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("month", entry.getKey().format(MONTH_FORMAT));
            row.put("amount", formatMoney(entry.getValue()));
            response.getRows().add(row);
            response.getChartData().add(new ChartPointDto(entry.getKey().format(MONTH_FORMAT), entry.getValue()));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse businessSummaryReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Company company = resolveCompany(subscriber, companyId);

        BigDecimal salesTotal = saleRepository.sumNetAmountBySubscriber(
                subscriberId, company.getId(), range.from(), range.to());
        BigDecimal purchasesTotal = purchaseRepository.sumNetAmountBySubscriber(
                subscriberId, company.getId(), range.from(), range.to());
        BigDecimal netPosition = salesTotal.subtract(purchasesTotal);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_SUMMARY");
        response.setTitle("Business Summary — " + subscriber.getBusinessName() + " / " + company.getName());
        response.getFilters().put("Company", company.getName());
        response.getFilters().put("From", formatDate(range.from()));
        response.getFilters().put("To", formatDate(range.to()));

        response.getSummary().add(new ReportSummaryItemDto("Net Sales", formatMoney(salesTotal)));
        response.getSummary().add(new ReportSummaryItemDto("Net Purchases", formatMoney(purchasesTotal)));
        response.getSummary().add(new ReportSummaryItemDto("Net Position", formatMoney(netPosition)));
        response.getSummary().add(new ReportSummaryItemDto(
                "Pending Receivables",
                formatMoney(saleRepository.sumPendingAmountBySubscriber(subscriberId, company.getId()))));
        response.getSummary().add(new ReportSummaryItemDto(
                "Pending Payables",
                formatMoney(purchaseRepository.sumPendingAmountBySubscriber(subscriberId, company.getId()))));

        response.getColumns().add(new ReportColumnDto("metric", "Metric", "left"));
        response.getColumns().add(new ReportColumnDto("amount", "Amount", "right"));

        addSummaryRow(response, "Net Sales", salesTotal);
        addSummaryRow(response, "Net Purchases", purchasesTotal);
        addSummaryRow(response, "Net Position (Sales − Purchases)", netPosition);

        response.getChartData().add(new ChartPointDto("Sales", salesTotal));
        response.getChartData().add(new ChartPointDto("Purchases", purchasesTotal));

        return response;
    }

    private Company resolveCompany(Subscriber subscriber, Long companyId) {
        if (companyId != null) {
            return companyService.requireAccessibleCompany(subscriber.getId(), companyId);
        }
        if (subscriber.getDefaultCompany() != null && subscriber.getDefaultCompany().isActive()) {
            return subscriber.getDefaultCompany();
        }
        return companyService.ensureDefaultCompany(subscriber.getId(), subscriber.getBusinessName());
    }

    private void addSummaryRow(AdminReportResponse response, String metric, BigDecimal amount) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("metric", metric);
        row.put("amount", formatMoney(amount));
        response.getRows().add(row);
    }

    private Map<YearMonth, BigDecimal> aggregateByMonth(java.util.List<Object[]> rows) {
        Map<YearMonth, BigDecimal> byMonth = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            YearMonth month = YearMonth.from(date);
            byMonth.merge(month, amount, BigDecimal::add);
        }
        return byMonth;
    }

    private DateRange resolveRange(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate resolvedTo = to != null ? to : today;
        LocalDate resolvedFrom = from != null ? from : resolvedTo.withDayOfMonth(1);

        if (resolvedFrom.isAfter(resolvedTo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "From date must be on or before to date");
        }

        return new DateRange(resolvedFrom, resolvedTo);
    }

    private String formatDate(LocalDate date) {
        return date.format(DATE_FORMAT);
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}
