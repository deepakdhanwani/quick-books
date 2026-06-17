package com.quickbooks.service;

import com.quickbooks.dto.report.AdminReportResponse;
import com.quickbooks.dto.report.ChartPointDto;
import com.quickbooks.dto.report.ReportColumnDto;
import com.quickbooks.dto.report.ReportSummaryItemDto;
import com.quickbooks.dto.subscriber.SubscriberDashboardResponse;
import com.quickbooks.dto.subscriber.SubscriberDataSummaryResponse;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.ProductRepository;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleItemRepository;
import com.quickbooks.repository.SaleRepository;
import com.quickbooks.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class SubscriberReportService {

    private static final int TOP_PARTY_LIMIT = 20;
    private static final int TOP_PRODUCT_LIMIT = 15;
    private static final int CONCENTRATION_CHART_LIMIT = 5;

    private final AdminSubscriberReportService adminSubscriberReportService;
    private final AdminSubscriberDataService adminSubscriberDataService;
    private final CompanyService companyService;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;
    private final SaleItemRepository saleItemRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;

    public SubscriberReportService(AdminSubscriberReportService adminSubscriberReportService,
                                   AdminSubscriberDataService adminSubscriberDataService,
                                   CompanyService companyService,
                                   SaleRepository saleRepository,
                                   PurchaseRepository purchaseRepository,
                                   SaleItemRepository saleItemRepository,
                                   CustomerRepository customerRepository,
                                   VendorRepository vendorRepository,
                                   ProductRepository productRepository) {
        this.adminSubscriberReportService = adminSubscriberReportService;
        this.adminSubscriberDataService = adminSubscriberDataService;
        this.companyService = companyService;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.saleItemRepository = saleItemRepository;
        this.customerRepository = customerRepository;
        this.vendorRepository = vendorRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public SubscriberDashboardResponse dashboard(Long subscriberId, Long companyId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal todaySales = saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, today, today);
        BigDecimal todayPurchases = purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, today, today);
        BigDecimal monthSales = saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, monthStart, today);
        BigDecimal monthPurchases = purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, monthStart, today);
        BigDecimal pendingReceivables = saleRepository.sumPendingAmountBySubscriber(subscriberId, companyId);
        BigDecimal pendingPayables = purchaseRepository.sumPendingAmountBySubscriber(subscriberId, companyId);

        SubscriberDashboardResponse response = new SubscriberDashboardResponse();
        response.setTodaySales(todaySales);
        response.setTodayPurchases(todayPurchases);
        response.setMonthSales(monthSales);
        response.setMonthPurchases(monthPurchases);
        response.setPendingReceivables(pendingReceivables);
        response.setPendingPayables(pendingPayables);
        response.setMonthNetPosition(monthSales.subtract(monthPurchases));
        response.setCustomerCount(customerRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setVendorCount(vendorRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setProductCount(productRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setSaleCount(saleRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setPurchaseCount(purchaseRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        return response;
    }

    @Transactional(readOnly = true)
    public SubscriberDataSummaryResponse summary(Long subscriberId, Long companyId) {
        return adminSubscriberDataService.getSummary(subscriberId, companyId);
    }

    @Transactional(readOnly = true)
    public AdminReportResponse salesReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        String companyName = companyService.requireAccessibleCompany(subscriberId, companyId).getName();

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_SALES");
        response.setTitle("Sales Report — " + companyName);
        response.getFilters().put("From", range.from().toString());
        response.getFilters().put("To", range.to().toString());

        BigDecimal total = saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, range.from(), range.to());
        BigDecimal pending = saleRepository.sumPendingAmountBySubscriber(subscriberId, companyId);
        long count = saleRepository.findAmountsByDateRange(subscriberId, companyId, range.from(), range.to()).size();

        response.getSummary().add(new ReportSummaryItemDto("Sales in Range", String.valueOf(count)));
        response.getSummary().add(new ReportSummaryItemDto("Net Sales", formatMoney(total)));
        response.getSummary().add(new ReportSummaryItemDto("Total Pending Receivables", formatMoney(pending)));

        response.getColumns().add(new ReportColumnDto("month", "Month", "left"));
        response.getColumns().add(new ReportColumnDto("amount", "Net Sales", "right"));

        Map<YearMonth, BigDecimal> byMonth = aggregateByMonth(
                saleRepository.findAmountsByDateRange(subscriberId, companyId, range.from(), range.to()));

        for (Map.Entry<YearMonth, BigDecimal> entry : byMonth.entrySet()) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("month", entry.getKey().toString());
            row.put("amount", formatMoney(entry.getValue()));
            response.getRows().add(row);
            response.getChartData().add(new ChartPointDto(entry.getKey().toString(), entry.getValue()));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse purchasesReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        String companyName = companyService.requireAccessibleCompany(subscriberId, companyId).getName();

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_PURCHASES");
        response.setTitle("Purchases Report — " + companyName);
        response.getFilters().put("From", range.from().toString());
        response.getFilters().put("To", range.to().toString());

        BigDecimal total = purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, range.from(), range.to());
        BigDecimal pending = purchaseRepository.sumPendingAmountBySubscriber(subscriberId, companyId);
        long count = purchaseRepository.findAmountsByDateRange(subscriberId, companyId, range.from(), range.to()).size();

        response.getSummary().add(new ReportSummaryItemDto("Purchases in Range", String.valueOf(count)));
        response.getSummary().add(new ReportSummaryItemDto("Net Purchases", formatMoney(total)));
        response.getSummary().add(new ReportSummaryItemDto("Total Pending Payables", formatMoney(pending)));

        response.getColumns().add(new ReportColumnDto("month", "Month", "left"));
        response.getColumns().add(new ReportColumnDto("amount", "Net Purchases", "right"));

        Map<YearMonth, BigDecimal> byMonth = aggregateByMonth(
                purchaseRepository.findAmountsByDateRange(subscriberId, companyId, range.from(), range.to()));

        for (Map.Entry<YearMonth, BigDecimal> entry : byMonth.entrySet()) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("month", entry.getKey().toString());
            row.put("amount", formatMoney(entry.getValue()));
            response.getRows().add(row);
            response.getChartData().add(new ChartPointDto(entry.getKey().toString(), entry.getValue()));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse businessSummaryReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        String companyName = companyService.requireAccessibleCompany(subscriberId, companyId).getName();

        BigDecimal salesTotal = saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, range.from(), range.to());
        BigDecimal purchasesTotal = purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, range.from(), range.to());
        BigDecimal netPosition = salesTotal.subtract(purchasesTotal);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_SUMMARY");
        response.setTitle("Business Summary — " + companyName);
        response.getFilters().put("From", range.from().toString());
        response.getFilters().put("To", range.to().toString());

        response.getSummary().add(new ReportSummaryItemDto("Net Sales", formatMoney(salesTotal)));
        response.getSummary().add(new ReportSummaryItemDto("Net Purchases", formatMoney(purchasesTotal)));
        response.getSummary().add(new ReportSummaryItemDto("Net Position", formatMoney(netPosition)));
        response.getSummary().add(new ReportSummaryItemDto(
                "Pending Receivables",
                formatMoney(saleRepository.sumPendingAmountBySubscriber(subscriberId, companyId))));
        response.getSummary().add(new ReportSummaryItemDto(
                "Pending Payables",
                formatMoney(purchaseRepository.sumPendingAmountBySubscriber(subscriberId, companyId))));

        response.getColumns().add(new ReportColumnDto("metric", "Metric", "left"));
        response.getColumns().add(new ReportColumnDto("amount", "Amount", "right"));

        addSummaryRow(response, "Net Sales", salesTotal);
        addSummaryRow(response, "Net Purchases", purchasesTotal);
        addSummaryRow(response, "Net Position (Sales − Purchases)", netPosition);

        response.getChartData().add(new ChartPointDto("Sales", salesTotal));
        response.getChartData().add(new ChartPointDto("Purchases", purchasesTotal));

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse receivablesReport(Long subscriberId, Long companyId) {
        return buildOutstandingReport(
                saleRepository.findReceivableDetailsBySubscriber(subscriberId, companyId),
                saleRepository.sumPendingAmountBySubscriber(subscriberId, companyId),
                "SUBSCRIBER_RECEIVABLES",
                "Collection Priority — Receivables",
                "customer");
    }

    @Transactional(readOnly = true)
    public AdminReportResponse payablesReport(Long subscriberId, Long companyId) {
        return buildOutstandingReport(
                purchaseRepository.findPayableDetailsBySubscriber(subscriberId, companyId),
                purchaseRepository.sumPendingAmountBySubscriber(subscriberId, companyId),
                "SUBSCRIBER_PAYABLES",
                "Payment Priority — Payables",
                "vendor");
    }

    @Transactional(readOnly = true)
    public AdminReportResponse customerTrendsReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        DateRange previous = previousPeriod(range);

        Map<String, PeriodPartyStats> current = toPartyStats(
                saleRepository.findCustomerSalesByPeriod(subscriberId, companyId, range.from(), range.to()));
        Map<String, PeriodPartyStats> prior = toPartyStats(
                saleRepository.findCustomerSalesByPeriod(subscriberId, companyId, previous.from(), previous.to()));

        BigDecimal totalRevenue = sumPartyRevenue(current);
        int totalOrders = sumPartyOrders(current);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_CUSTOMER_TRENDS");
        response.setTitle("Customer Trends");
        response.getFilters().put("From", range.from().toString());
        response.getFilters().put("To", range.to().toString());

        response.getSummary().add(new ReportSummaryItemDto("Active Customers", String.valueOf(current.size())));
        response.getSummary().add(new ReportSummaryItemDto("Orders", String.valueOf(totalOrders)));
        response.getSummary().add(new ReportSummaryItemDto("Revenue", formatMoney(totalRevenue)));
        response.getSummary().add(new ReportSummaryItemDto(
                "Avg Order Value",
                formatMoney(averageOrderValue(totalRevenue, totalOrders))));

        response.getColumns().add(new ReportColumnDto("customer", "Customer", "left"));
        response.getColumns().add(new ReportColumnDto("orders", "Orders", "right"));
        response.getColumns().add(new ReportColumnDto("revenue", "Revenue", "right"));
        response.getColumns().add(new ReportColumnDto("share", "Share", "right"));
        response.getColumns().add(new ReportColumnDto("growth", "Growth", "right"));

        current.entrySet().stream()
                .sorted((a, b) -> b.getValue().amount().compareTo(a.getValue().amount()))
                .limit(TOP_PARTY_LIMIT)
                .forEach(entry -> {
                    String name = entry.getKey();
                    PeriodPartyStats stats = entry.getValue();
                    PeriodPartyStats prev = prior.getOrDefault(name, PeriodPartyStats.empty());
                    double growth = percentChange(stats.amount(), prev.amount());
                    double share = sharePercent(stats.amount(), totalRevenue);

                    Map<String, String> row = new LinkedHashMap<>();
                    row.put("customer", name);
                    row.put("orders", String.valueOf(stats.orders()));
                    row.put("revenue", formatMoney(stats.amount()));
                    row.put("share", formatPercent(share));
                    row.put("growth", formatGrowth(growth));
                    response.getRows().add(row);
                    response.getChartData().add(new ChartPointDto(name, stats.amount()));
                });

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse vendorTrendsReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        DateRange previous = previousPeriod(range);

        Map<String, PeriodPartyStats> current = toPartyStats(
                purchaseRepository.findVendorPurchasesByPeriod(subscriberId, companyId, range.from(), range.to()));
        Map<String, PeriodPartyStats> prior = toPartyStats(
                purchaseRepository.findVendorPurchasesByPeriod(subscriberId, companyId, previous.from(), previous.to()));

        BigDecimal totalSpend = sumPartyRevenue(current);
        int totalOrders = sumPartyOrders(current);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_VENDOR_TRENDS");
        response.setTitle("Vendor Spend — Payments to Vendors");
        response.getFilters().put("From", range.from().toString());
        response.getFilters().put("To", range.to().toString());

        response.getSummary().add(new ReportSummaryItemDto("Active Vendors", String.valueOf(current.size())));
        response.getSummary().add(new ReportSummaryItemDto("Purchase Orders", String.valueOf(totalOrders)));
        response.getSummary().add(new ReportSummaryItemDto("Spend", formatMoney(totalSpend)));
        response.getSummary().add(new ReportSummaryItemDto(
                "Avg PO Value",
                formatMoney(averageOrderValue(totalSpend, totalOrders))));

        response.getColumns().add(new ReportColumnDto("vendor", "Vendor", "left"));
        response.getColumns().add(new ReportColumnDto("orders", "POs", "right"));
        response.getColumns().add(new ReportColumnDto("spend", "Spend", "right"));
        response.getColumns().add(new ReportColumnDto("share", "Share", "right"));
        response.getColumns().add(new ReportColumnDto("growth", "Growth", "right"));

        current.entrySet().stream()
                .sorted((a, b) -> b.getValue().amount().compareTo(a.getValue().amount()))
                .limit(TOP_PARTY_LIMIT)
                .forEach(entry -> {
                    String name = entry.getKey();
                    PeriodPartyStats stats = entry.getValue();
                    PeriodPartyStats prev = prior.getOrDefault(name, PeriodPartyStats.empty());
                    double growth = percentChange(stats.amount(), prev.amount());
                    double share = sharePercent(stats.amount(), totalSpend);

                    Map<String, String> row = new LinkedHashMap<>();
                    row.put("vendor", name);
                    row.put("orders", String.valueOf(stats.orders()));
                    row.put("spend", formatMoney(stats.amount()));
                    row.put("share", formatPercent(share));
                    row.put("growth", formatGrowth(growth));
                    response.getRows().add(row);
                    response.getChartData().add(new ChartPointDto(name, stats.amount()));
                });

        return response;
    }

    @Transactional(readOnly = true)
    public AdminReportResponse ordersReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);
        DateRange previous = previousPeriod(range);

        Object[] currentAgg = firstAggregateRow(
                saleRepository.aggregateSalesPerformance(subscriberId, companyId, range.from(), range.to()));
        Object[] priorAgg = firstAggregateRow(
                saleRepository.aggregateSalesPerformance(subscriberId, companyId, previous.from(), previous.to()));

        long orders = toLong(currentAgg[0]);
        BigDecimal revenue = toBigDecimal(currentAgg[1]);
        BigDecimal aov = toBigDecimal(currentAgg[2]);

        long priorOrders = toLong(priorAgg[0]);
        BigDecimal priorRevenue = toBigDecimal(priorAgg[1]);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_ORDERS");
        response.setTitle("Order Performance");
        response.getFilters().put("From", range.from().toString());
        response.getFilters().put("To", range.to().toString());

        response.getSummary().add(new ReportSummaryItemDto("Orders", String.valueOf(orders)));
        response.getSummary().add(new ReportSummaryItemDto("Revenue", formatMoney(revenue)));
        response.getSummary().add(new ReportSummaryItemDto("Avg Order Value", formatMoney(aov)));
        response.getSummary().add(new ReportSummaryItemDto(
                "Order Growth",
                formatGrowth(percentChange(BigDecimal.valueOf(orders), BigDecimal.valueOf(priorOrders)))));
        response.getSummary().add(new ReportSummaryItemDto(
                "Revenue Growth",
                formatGrowth(percentChange(revenue, priorRevenue))));

        response.getColumns().add(new ReportColumnDto("metric", "Metric", "left"));
        response.getColumns().add(new ReportColumnDto("current", "Current", "right"));
        response.getColumns().add(new ReportColumnDto("previous", "Previous", "right"));
        response.getColumns().add(new ReportColumnDto("change", "Change", "right"));

        addComparisonRow(response, "Orders", BigDecimal.valueOf(orders), BigDecimal.valueOf(priorOrders));
        addComparisonRow(response, "Revenue", revenue, priorRevenue);
        addComparisonRow(response, "Avg Order Value", aov, toBigDecimal(priorAgg[2]));

        response.getChartData().add(new ChartPointDto("Orders", BigDecimal.valueOf(orders)));
        response.getChartData().add(new ChartPointDto("Revenue", revenue));
        response.getChartData().add(new ChartPointDto("Prior Orders", BigDecimal.valueOf(priorOrders), true));
        response.getChartData().add(new ChartPointDto("Prior Revenue", priorRevenue, true));

        return response;
    }

    private AdminReportResponse buildOutstandingReport(List<Object[]> rows,
                                                       BigDecimal totalPending,
                                                       String reportType,
                                                       String title,
                                                       String partyKey) {
        AdminReportResponse response = new AdminReportResponse();
        response.setReportType(reportType);
        response.setTitle(title);
        response.getSummary().add(new ReportSummaryItemDto("Accounts", String.valueOf(rows.size())));
        response.getSummary().add(new ReportSummaryItemDto("Total Outstanding", formatMoney(totalPending)));

        if (!rows.isEmpty() && totalPending.compareTo(BigDecimal.ZERO) > 0) {
            Object[] top = rows.get(0);
            BigDecimal topAmount = (BigDecimal) top[1];
            double concentration = sharePercent(topAmount, totalPending);
            response.getSummary().add(new ReportSummaryItemDto(
                    "Top Account Share",
                    formatPercent(concentration)));
        }

        response.getColumns().add(new ReportColumnDto("rank", "#", "right"));
        response.getColumns().add(new ReportColumnDto(partyKey, "Name", "left"));
        response.getColumns().add(new ReportColumnDto("openDocs", "Open", "right"));
        response.getColumns().add(new ReportColumnDto("amount", "Outstanding", "right"));
        response.getColumns().add(new ReportColumnDto("share", "Share", "right"));
        response.getColumns().add(new ReportColumnDto("priority", "Priority", "left"));

        int chartCount = 0;
        for (int i = 0; i < rows.size(); i++) {
            Object[] row = rows.get(i);
            String name = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            long openDocs = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            double share = sharePercent(amount, totalPending);
            String priority = share >= 25 ? "High" : share >= 10 ? "Medium" : "Low";

            Map<String, String> tableRow = new LinkedHashMap<>();
            tableRow.put("rank", String.valueOf(i + 1));
            tableRow.put(partyKey, name);
            tableRow.put("openDocs", String.valueOf(openDocs));
            tableRow.put("amount", formatMoney(amount));
            tableRow.put("share", formatPercent(share));
            tableRow.put("priority", priority);
            response.getRows().add(tableRow);

            if (chartCount < CONCENTRATION_CHART_LIMIT) {
                response.getChartData().add(new ChartPointDto(name, amount));
                chartCount++;
            }
        }

        return response;
    }

    private void addComparisonRow(AdminReportResponse response,
                                  String metric,
                                  BigDecimal current,
                                  BigDecimal previous) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("metric", metric);
        row.put("current", formatMoney(current));
        row.put("previous", formatMoney(previous));
        row.put("change", formatGrowth(percentChange(current, previous)));
        response.getRows().add(row);
    }

    private Map<String, PeriodPartyStats> toPartyStats(List<Object[]> rows) {
        Map<String, PeriodPartyStats> stats = new HashMap<>();
        for (Object[] row : rows) {
            String name = (String) row[0];
            long orders = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            BigDecimal amount = nz((BigDecimal) row[2]);
            stats.put(name, new PeriodPartyStats(orders, amount));
        }
        return stats;
    }

    private BigDecimal sumPartyRevenue(Map<String, PeriodPartyStats> stats) {
        return stats.values().stream()
                .map(PeriodPartyStats::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int sumPartyOrders(Map<String, PeriodPartyStats> stats) {
        return stats.values().stream().mapToInt(s -> (int) s.orders()).sum();
    }

    private BigDecimal averageOrderValue(BigDecimal revenue, int orders) {
        if (orders <= 0) {
            return BigDecimal.ZERO;
        }
        return revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP);
    }

    private double sharePercent(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return part.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private double percentChange(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private String formatPercent(double value) {
        return String.format(Locale.ROOT, "%.1f%%", value);
    }

    private String formatGrowth(double value) {
        if (value > 0.5) {
            return "+" + formatPercent(value).replace("%", "") + "%";
        }
        if (value < -0.5) {
            return formatPercent(value);
        }
        return "0%";
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

    private DateRange previousPeriod(DateRange range) {
        long days = ChronoUnit.DAYS.between(range.from(), range.to()) + 1;
        LocalDate prevTo = range.from().minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);
        return new DateRange(prevFrom, prevTo);
    }

    private Object[] firstAggregateRow(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return new Object[] { 0L, BigDecimal.ZERO, BigDecimal.ZERO };
        }
        Object[] row = rows.get(0);
        if (row.length == 1 && row[0] instanceof Object[] nested) {
            return nested;
        }
        return row;
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private record PeriodPartyStats(long orders, BigDecimal amount) {
        static PeriodPartyStats empty() {
            return new PeriodPartyStats(0, BigDecimal.ZERO);
        }
    }

    @Transactional(readOnly = true)
    public AdminReportResponse productPerformanceReport(Long subscriberId, Long companyId, LocalDate from, LocalDate to) {
        LocalDate resolvedTo = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate resolvedFrom = from != null ? from : resolvedTo.withDayOfMonth(1);

        List<Object[]> rows = saleItemRepository.findTopProductsBySales(subscriberId, companyId, resolvedFrom, resolvedTo);

        AdminReportResponse response = new AdminReportResponse();
        response.setReportType("SUBSCRIBER_PRODUCTS");
        response.setTitle("Product Performance");
        response.getFilters().put("From", resolvedFrom.toString());
        response.getFilters().put("To", resolvedTo.toString());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalQuantity = BigDecimal.ZERO;
        for (Object[] row : rows) {
            totalQuantity = totalQuantity.add((BigDecimal) row[1]);
            totalRevenue = totalRevenue.add((BigDecimal) row[2]);
        }

        response.getSummary().add(new ReportSummaryItemDto("Products Sold", String.valueOf(rows.size())));
        response.getSummary().add(new ReportSummaryItemDto("Total Quantity", formatQuantity(totalQuantity)));
        response.getSummary().add(new ReportSummaryItemDto("Total Revenue", formatMoney(totalRevenue)));

        response.getColumns().add(new ReportColumnDto("product", "Product", "left"));
        response.getColumns().add(new ReportColumnDto("quantity", "Qty Sold", "right"));
        response.getColumns().add(new ReportColumnDto("revenue", "Revenue", "right"));

        int limit = Math.min(rows.size(), TOP_PRODUCT_LIMIT);
        for (int i = 0; i < limit; i++) {
            Object[] row = rows.get(i);
            String productName = (String) row[0];
            BigDecimal quantity = (BigDecimal) row[1];
            BigDecimal revenue = (BigDecimal) row[2];

            Map<String, String> tableRow = new LinkedHashMap<>();
            tableRow.put("product", productName);
            tableRow.put("quantity", formatQuantity(quantity));
            tableRow.put("revenue", formatMoney(revenue));
            response.getRows().add(tableRow);
            response.getChartData().add(new ChartPointDto(productName, revenue));
        }

        return response;
    }

    private void addSummaryRow(AdminReportResponse response, String metric, BigDecimal amount) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("metric", metric);
        row.put("amount", formatMoney(amount));
        response.getRows().add(row);
    }

    private Map<YearMonth, BigDecimal> aggregateByMonth(List<Object[]> rows) {
        Map<YearMonth, BigDecimal> byMonth = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            YearMonth month = YearMonth.from(date);
            byMonth.merge(month, amount, BigDecimal::add);
        }
        return byMonth;
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatQuantity(BigDecimal quantity) {
        if (quantity == null) {
            return "0";
        }
        return quantity.stripTrailingZeros().toPlainString();
    }
}
