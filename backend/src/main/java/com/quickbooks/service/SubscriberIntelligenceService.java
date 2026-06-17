package com.quickbooks.service;

import com.quickbooks.dto.report.ChartPointDto;
import com.quickbooks.dto.subscriber.BusinessInsightDto;
import com.quickbooks.dto.subscriber.CashFlowOutlookDto;
import com.quickbooks.dto.subscriber.ForecastMetricDto;
import com.quickbooks.dto.subscriber.SubscriberIntelligenceResponse;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleItemRepository;
import com.quickbooks.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class SubscriberIntelligenceService {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final int TREND_MONTHS = 3;

    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;
    private final SaleItemRepository saleItemRepository;

    public SubscriberIntelligenceService(SaleRepository saleRepository,
                                         PurchaseRepository purchaseRepository,
                                         SaleItemRepository saleItemRepository) {
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.saleItemRepository = saleItemRepository;
    }

    @Transactional(readOnly = true)
    public SubscriberIntelligenceResponse buildIntelligence(Long subscriberId, Long companyId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate monthStart = today.withDayOfMonth(1);
        int daysElapsed = Math.max(today.getDayOfMonth(), 1);
        int daysInMonth = today.lengthOfMonth();

        BigDecimal monthSalesMtd = nz(saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, monthStart, today));
        BigDecimal monthPurchasesMtd = nz(purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, monthStart, today));
        BigDecimal pendingReceivables = nz(saleRepository.sumPendingAmountBySubscriber(subscriberId, companyId));
        BigDecimal pendingPayables = nz(purchaseRepository.sumPendingAmountBySubscriber(subscriberId, companyId));

        BigDecimal projectedMonthSales = projectMonthEnd(monthSalesMtd, daysElapsed, daysInMonth);
        BigDecimal projectedMonthPurchases = projectMonthEnd(monthPurchasesMtd, daysElapsed, daysInMonth);
        BigDecimal projectedNet = projectedMonthSales.subtract(projectedMonthPurchases);

        LocalDate prevMonthEnd = monthStart.minusDays(1);
        LocalDate prevMonthStart = prevMonthEnd.withDayOfMonth(1);
        int comparableDay = Math.min(daysElapsed, prevMonthEnd.getDayOfMonth());
        LocalDate prevComparableEnd = prevMonthStart.plusDays(comparableDay - 1L);

        BigDecimal prevSalesComparable = nz(
                saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, prevMonthStart, prevComparableEnd));
        BigDecimal prevPurchasesComparable = nz(
                purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, prevMonthStart, prevComparableEnd));
        BigDecimal prevMonthSalesFull = nz(
                saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, prevMonthStart, prevMonthEnd));
        BigDecimal prevMonthPurchasesFull = nz(
                purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, prevMonthStart, prevMonthEnd));

        double salesChange = percentChange(monthSalesMtd, prevSalesComparable);
        double purchaseChange = percentChange(monthPurchasesMtd, prevPurchasesComparable);

        YearMonth nextMonth = YearMonth.from(today).plusMonths(1);
        BigDecimal nextMonthSalesForecast = forecastNextMonth(projectedMonthSales, salesChange);
        BigDecimal nextMonthPurchaseForecast = forecastNextMonth(projectedMonthPurchases, purchaseChange);

        SubscriberIntelligenceResponse response = new SubscriberIntelligenceResponse();
        response.getForecasts().add(buildForecast(
                "SALES_MONTH",
                "Month-end Sales",
                monthSalesMtd,
                projectedMonthSales,
                prevSalesComparable,
                salesChange,
                "This month"));
        response.getForecasts().add(buildForecast(
                "PURCHASES_MONTH",
                "Month-end Purchases",
                monthPurchasesMtd,
                projectedMonthPurchases,
                prevPurchasesComparable,
                purchaseChange,
                "This month"));
        response.getForecasts().add(buildForecast(
                "SALES_NEXT",
                "Next Month Sales",
                projectedMonthSales,
                nextMonthSalesForecast,
                prevMonthSalesFull,
                percentChange(nextMonthSalesForecast, prevMonthSalesFull),
                nextMonth.format(MONTH_FORMAT)));
        response.getForecasts().add(buildForecast(
                "NET_POSITION",
                "Projected Net",
                monthSalesMtd.subtract(monthPurchasesMtd),
                projectedNet,
                prevSalesComparable.subtract(prevPurchasesComparable),
                percentChange(projectedNet, prevMonthSalesFull.subtract(prevMonthPurchasesFull)),
                "This month"));

        CashFlowOutlookDto cashFlow = new CashFlowOutlookDto();
        cashFlow.setReceivables(pendingReceivables);
        cashFlow.setPayables(pendingPayables);
        cashFlow.setExpectedInflow(projectedMonthSales.add(pendingReceivables.multiply(new BigDecimal("0.35"))));
        cashFlow.setExpectedOutflow(projectedMonthPurchases.add(pendingPayables.multiply(new BigDecimal("0.45"))));
        cashFlow.setNetOutlook(cashFlow.getExpectedInflow().subtract(cashFlow.getExpectedOutflow()));
        cashFlow.setSummary(buildCashFlowSummary(cashFlow));
        response.setCashFlowOutlook(cashFlow);

        int healthScore = calculateHealthScore(
                projectedNet,
                salesChange,
                pendingReceivables,
                projectedMonthSales,
                pendingPayables,
                projectedMonthPurchases);
        response.setHealthScore(healthScore);
        response.setHealthLabel(healthLabel(healthScore));
        response.setHealthSummary(buildHealthSummary(healthScore, salesChange, projectedNet));

        response.setSalesTrend(buildSalesTrend(subscriberId, companyId, today, projectedMonthSales, nextMonthSalesForecast));
        response.setPurchaseTrend(buildPurchaseTrend(
                subscriberId, companyId, today, projectedMonthPurchases, nextMonthPurchaseForecast));

        response.getInsights().addAll(buildInsights(
                subscriberId,
                companyId,
                monthSalesMtd,
                monthPurchasesMtd,
                projectedMonthSales,
                projectedMonthPurchases,
                projectedNet,
                pendingReceivables,
                pendingPayables,
                salesChange,
                purchaseChange,
                nextMonthSalesForecast,
                cashFlow));

        response.getInsights().sort(Comparator
                .comparingInt((BusinessInsightDto insight) -> priorityRank(insight.getPriority()))
                .thenComparing(BusinessInsightDto::getType));

        return response;
    }

    private List<ChartPointDto> buildSalesTrend(Long subscriberId,
                                                Long companyId,
                                                LocalDate today,
                                                BigDecimal projectedMonthSales,
                                                BigDecimal nextMonthForecast) {
        List<ChartPointDto> points = new ArrayList<>();
        YearMonth current = YearMonth.from(today);

        for (int offset = TREND_MONTHS; offset >= 1; offset--) {
            YearMonth month = current.minusMonths(offset);
            LocalDate from = month.atDay(1);
            LocalDate to = month.atEndOfMonth();
            BigDecimal amount = nz(saleRepository.sumNetAmountBySubscriber(subscriberId, companyId, from, to));
            points.add(new ChartPointDto(month.format(MONTH_FORMAT), amount, false));
        }

        points.add(new ChartPointDto(current.format(MONTH_FORMAT) + " (proj.)", projectedMonthSales, true));
        points.add(new ChartPointDto(current.plusMonths(1).format(MONTH_FORMAT) + " (fcst.)", nextMonthForecast, true));
        return points;
    }

    private List<ChartPointDto> buildPurchaseTrend(Long subscriberId,
                                                   Long companyId,
                                                   LocalDate today,
                                                   BigDecimal projectedMonthPurchases,
                                                   BigDecimal nextMonthForecast) {
        List<ChartPointDto> points = new ArrayList<>();
        YearMonth current = YearMonth.from(today);

        for (int offset = TREND_MONTHS; offset >= 1; offset--) {
            YearMonth month = current.minusMonths(offset);
            LocalDate from = month.atDay(1);
            LocalDate to = month.atEndOfMonth();
            BigDecimal amount = nz(purchaseRepository.sumNetAmountBySubscriber(subscriberId, companyId, from, to));
            points.add(new ChartPointDto(month.format(MONTH_FORMAT), amount, false));
        }

        points.add(new ChartPointDto(current.format(MONTH_FORMAT) + " (proj.)", projectedMonthPurchases, true));
        points.add(new ChartPointDto(current.plusMonths(1).format(MONTH_FORMAT) + " (fcst.)", nextMonthForecast, true));
        return points;
    }

    private List<BusinessInsightDto> buildInsights(Long subscriberId,
                                                   Long companyId,
                                                   BigDecimal monthSalesMtd,
                                                   BigDecimal monthPurchasesMtd,
                                                   BigDecimal projectedMonthSales,
                                                   BigDecimal projectedMonthPurchases,
                                                   BigDecimal projectedNet,
                                                   BigDecimal pendingReceivables,
                                                   BigDecimal pendingPayables,
                                                   double salesChange,
                                                   double purchaseChange,
                                                   BigDecimal nextMonthSalesForecast,
                                                   CashFlowOutlookDto cashFlow) {
        List<BusinessInsightDto> insights = new ArrayList<>();

        insights.add(insight(
                "FORECAST",
                "HIGH",
                "Month-end sales projection",
                "At your current daily pace, sales may close around "
                        + money(projectedMonthSales)
                        + " this month"
                        + trendText(salesChange)
                        + ".",
                money(projectedMonthSales)));

        insights.add(insight(
                "FORECAST",
                "HIGH",
                "Next month outlook",
                "Based on recent momentum, next month sales could reach around "
                        + money(nextMonthSalesForecast)
                        + ". Plan inventory and staffing accordingly.",
                money(nextMonthSalesForecast)));

        if (projectedNet.compareTo(BigDecimal.ZERO) < 0) {
            insights.add(insight(
                    "RISK",
                    "HIGH",
                    "Spending ahead of revenue",
                    "Projected purchases ("
                            + money(projectedMonthPurchases)
                            + ") may exceed projected sales ("
                            + money(projectedMonthSales)
                            + "). Slow discretionary spending until collections improve.",
                    money(projectedNet.abs())));
        } else {
            insights.add(insight(
                    "OPPORTUNITY",
                    "MEDIUM",
                    "Healthy monthly margin",
                    "Projected net position is "
                            + money(projectedNet)
                            + ". Consider reinvesting in fast-moving products or customer retention.",
                    money(projectedNet)));
        }

        if (pendingReceivables.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal receivableRatio = ratio(pendingReceivables, projectedMonthSales.max(monthSalesMtd));
            String priority = receivableRatio.compareTo(new BigDecimal("0.40")) >= 0 ? "HIGH" : "MEDIUM";
            insights.add(insight(
                    "ACTION",
                    priority,
                    "Accelerate collections",
                    money(pendingReceivables)
                            + " is still outstanding from customers. Prioritize follow-ups on the largest balances to unlock cash.",
                    money(pendingReceivables)));
        }

        if (pendingPayables.compareTo(BigDecimal.ZERO) > 0) {
            insights.add(insight(
                    "ACTION",
                    "MEDIUM",
                    "Schedule vendor payments",
                    "You owe "
                            + money(pendingPayables)
                            + " to vendors. Align payouts with expected inflows to avoid cash pressure.",
                    money(pendingPayables)));
        }

        if (cashFlow.getNetOutlook().compareTo(BigDecimal.ZERO) < 0) {
            insights.add(insight(
                    "RISK",
                    "HIGH",
                    "Tight cash outlook",
                    cashFlow.getSummary(),
                    money(cashFlow.getNetOutlook().abs())));
        }

        if (purchaseChange > 15 && salesChange < 5) {
            insights.add(insight(
                    "RISK",
                    "MEDIUM",
                    "Purchase growth outpacing sales",
                    "Purchases grew "
                            + round(purchaseChange)
                            + "% while sales moved "
                            + round(salesChange)
                            + "%. Review vendor orders before month-end.",
                    round(purchaseChange) + "%"));
        }

        appendTopProductInsight(subscriberId, companyId, insights, monthSalesMtd);

        return insights;
    }

    private void appendTopProductInsight(Long subscriberId,
                                         Long companyId,
                                         List<BusinessInsightDto> insights,
                                         BigDecimal monthSalesMtd) {
        if (monthSalesMtd.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate monthStart = today.withDayOfMonth(1);
        List<Object[]> products = saleItemRepository.findTopProductsBySales(subscriberId, companyId, monthStart, today);
        if (products.isEmpty()) {
            return;
        }

        Object[] top = products.get(0);
        String productName = (String) top[0];
        BigDecimal revenue = (BigDecimal) top[2];
        insights.add(insight(
                "OPPORTUNITY",
                "MEDIUM",
                "Double down on top seller",
                productName
                        + " leads revenue this month ("
                        + money(revenue)
                        + "). Ensure availability to capture projected demand.",
                money(revenue)));
    }

    private int calculateHealthScore(BigDecimal projectedNet,
                                   double salesChange,
                                   BigDecimal pendingReceivables,
                                   BigDecimal projectedMonthSales,
                                   BigDecimal pendingPayables,
                                   BigDecimal projectedMonthPurchases) {
        int score = 55;

        if (projectedNet.compareTo(BigDecimal.ZERO) > 0) {
            score += 15;
        } else if (projectedNet.compareTo(BigDecimal.ZERO) < 0) {
            score -= 18;
        }

        if (salesChange > 8) {
            score += 12;
        } else if (salesChange > 0) {
            score += 6;
        } else if (salesChange < -10) {
            score -= 12;
        } else if (salesChange < 0) {
            score -= 6;
        }

        BigDecimal receivableRatio = ratio(pendingReceivables, projectedMonthSales);
        if (receivableRatio.compareTo(new BigDecimal("0.50")) > 0) {
            score -= 14;
        } else if (receivableRatio.compareTo(new BigDecimal("0.30")) > 0) {
            score -= 7;
        } else if (receivableRatio.compareTo(new BigDecimal("0.15")) < 0) {
            score += 5;
        }

        BigDecimal payableRatio = ratio(pendingPayables, projectedMonthPurchases.max(BigDecimal.ONE));
        if (payableRatio.compareTo(new BigDecimal("0.50")) > 0) {
            score -= 8;
        }

        return Math.max(0, Math.min(100, score));
    }

    private String healthLabel(int score) {
        if (score >= 80) {
            return "Strong";
        }
        if (score >= 65) {
            return "Stable";
        }
        if (score >= 45) {
            return "Watch";
        }
        return "At Risk";
    }

    private String buildHealthSummary(int score, double salesChange, BigDecimal projectedNet) {
        if (score >= 80) {
            return "Momentum and cash signals look healthy. Keep executing on top products and collections.";
        }
        if (score >= 65) {
            return "Business is steady"
                    + trendText(salesChange)
                    + ". Focus on receivables to strengthen liquidity.";
        }
        if (score >= 45) {
            return "Some pressure detected. Tighten collections and review upcoming vendor payouts.";
        }
        return "Cash and margin signals need attention. Prioritize collections and defer non-essential purchases.";
    }

    private String buildCashFlowSummary(CashFlowOutlookDto cashFlow) {
        if (cashFlow.getNetOutlook().compareTo(BigDecimal.ZERO) >= 0) {
            return "Expected inflows of "
                    + money(cashFlow.getExpectedInflow())
                    + " should cover projected outflows of "
                    + money(cashFlow.getExpectedOutflow())
                    + " if collections stay on track.";
        }
        return "Projected outflows ("
                + money(cashFlow.getExpectedOutflow())
                + ") may exceed inflows ("
                + money(cashFlow.getExpectedInflow())
                + "). Accelerate customer collections this week.";
    }

    private ForecastMetricDto buildForecast(String key,
                                            String label,
                                            BigDecimal current,
                                            BigDecimal projected,
                                            BigDecimal previous,
                                            double changePercent,
                                            String period) {
        ForecastMetricDto metric = new ForecastMetricDto();
        metric.setKey(key);
        metric.setLabel(label);
        metric.setCurrentValue(current);
        metric.setProjectedValue(projected);
        metric.setPreviousValue(previous);
        metric.setChangePercent(changePercent);
        metric.setPeriod(period);
        return metric;
    }

    private BigDecimal projectMonthEnd(BigDecimal mtd, int daysElapsed, int daysInMonth) {
        if (mtd.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return mtd
                .multiply(BigDecimal.valueOf(daysInMonth))
                .divide(BigDecimal.valueOf(daysElapsed), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal forecastNextMonth(BigDecimal projectedCurrentMonth, double changePercent) {
        if (projectedCurrentMonth.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal multiplier = BigDecimal.ONE.add(
                BigDecimal.valueOf(changePercent).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        multiplier = multiplier.max(new BigDecimal("0.70"));
        multiplier = multiplier.min(new BigDecimal("1.35"));
        return projectedCurrentMonth.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    private double percentChange(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private BigDecimal ratio(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return numerator.divide(denominator, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String money(BigDecimal amount) {
        return "₹" + nz(amount).setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String trendText(double changePercent) {
        if (changePercent > 1) {
            return " (up " + round(changePercent) + "% vs same period last month)";
        }
        if (changePercent < -1) {
            return " (down " + round(Math.abs(changePercent)) + "% vs same period last month)";
        }
        return " (flat vs same period last month)";
    }

    private String round(double value) {
        return String.valueOf(Math.round(value));
    }

    private BusinessInsightDto insight(String type,
                                       String priority,
                                       String title,
                                       String message,
                                       String metric) {
        BusinessInsightDto dto = new BusinessInsightDto();
        dto.setType(type);
        dto.setPriority(priority);
        dto.setTitle(title);
        dto.setMessage(message);
        dto.setMetric(metric);
        return dto;
    }

    private int priorityRank(String priority) {
        if ("HIGH".equals(priority)) {
            return 0;
        }
        if ("MEDIUM".equals(priority)) {
            return 1;
        }
        return 2;
    }
}
