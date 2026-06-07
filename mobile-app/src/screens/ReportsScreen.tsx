import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { CashFlowOutlookCard } from '../components/bi/CashFlowOutlookCard';
import { CashLedgerPanel } from '../components/bi/CashLedgerPanel';
import { ForecastStrip } from '../components/bi/ForecastStrip';
import { HealthScoreCard } from '../components/bi/HealthScoreCard';
import { InsightFeed } from '../components/bi/InsightFeed';
import { QuickPeriodPreset, ReportPeriodBar } from '../components/bi/ReportPeriodBar';
import { SegmentedControl } from '../components/bi/SegmentedControl';
import { TrendChart } from '../components/bi/TrendChart';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { ReportSummaryGrid } from '../components/ReportSummaryGrid';
import { ReportTable } from '../components/ReportTable';
import { api, BusinessIntelligence, BusinessReport } from '../services/api';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { AppliedDateFilter } from '../utils/dateListFilter';
import { quickPresetToDateFilter, resolveReportPeriod } from '../utils/reportPeriod';

type ReportsScreenProps = {
  token: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

type ReportSegment =
  | 'PULSE'
  | 'SALES'
  | 'CUSTOMERS'
  | 'VENDORS'
  | 'ORDERS'
  | 'CASH'
  | 'PRODUCTS';

const SEGMENTS: { id: ReportSegment; label: string }[] = [
  { id: 'PULSE', label: 'Pulse' },
  { id: 'SALES', label: 'Sales' },
  { id: 'CUSTOMERS', label: 'Customers' },
  { id: 'VENDORS', label: 'Vendors' },
  { id: 'ORDERS', label: 'Orders' },
  { id: 'CASH', label: 'Cash' },
  { id: 'PRODUCTS', label: 'Products' },
];

const SEGMENT_CHART_TITLE: Record<ReportSegment, string> = {
  PULSE: 'Trend',
  SALES: 'Sales trend',
  CUSTOMERS: 'Revenue by customer',
  VENDORS: 'Payments to vendors',
  ORDERS: 'Orders vs revenue',
  CASH: 'Outstanding',
  PRODUCTS: 'Revenue by product',
};

const SEGMENT_TABLE_TITLE: Partial<Record<ReportSegment, string>> = {
  CUSTOMERS: 'Customer revenue ledger',
  VENDORS: 'Vendor payment ledger',
  PRODUCTS: 'Product performance ledger',
  ORDERS: 'Period comparison',
  SALES: 'Sales breakdown',
};

export function ReportsScreen({ token, refreshing, onRefresh }: ReportsScreenProps) {
  const styles = useThemedStyles(createStyles);

  const [segment, setSegment] = useState<ReportSegment>('PULSE');
  const [quickPreset, setQuickPreset] = useState<QuickPeriodPreset>('month');
  const [dateFilter, setDateFilter] = useState<AppliedDateFilter>(() => quickPresetToDateFilter('month'));

  const [intelligence, setIntelligence] = useState<BusinessIntelligence | null>(null);
  const [detailReport, setDetailReport] = useState<BusinessReport | null>(null);
  const [cashReceivables, setCashReceivables] = useState<BusinessReport | null>(null);
  const [cashPayables, setCashPayables] = useState<BusinessReport | null>(null);

  const [loadingIntel, setLoadingIntel] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  const loadIntelligence = useCallback(async () => {
    setLoadingIntel(true);
    setError('');
    try {
      const data = await api.getIntelligence(token);
      setIntelligence(data);
    } catch (err) {
      setIntelligence(null);
      setError(err instanceof Error ? err.message : 'Failed to load business intelligence');
    } finally {
      setLoadingIntel(false);
    }
  }, [token]);

  const loadDetail = useCallback(async () => {
    if (segment === 'PULSE') {
      setDetailReport(null);
      setCashReceivables(null);
      setCashPayables(null);
      return;
    }

    setLoadingDetail(true);
    setError('');
    const { fromDate, toDate } = resolveReportPeriod(quickPreset, dateFilter);

    try {
      if (segment === 'SALES') {
        setDetailReport(await api.getSalesReport(token, fromDate, toDate));
        setCashReceivables(null);
        setCashPayables(null);
      } else if (segment === 'CUSTOMERS') {
        setDetailReport(await api.getCustomerTrendsReport(token, fromDate, toDate));
        setCashReceivables(null);
        setCashPayables(null);
      } else if (segment === 'VENDORS') {
        setDetailReport(await api.getVendorTrendsReport(token, fromDate, toDate));
        setCashReceivables(null);
        setCashPayables(null);
      } else if (segment === 'ORDERS') {
        setDetailReport(await api.getOrdersReport(token, fromDate, toDate));
        setCashReceivables(null);
        setCashPayables(null);
      } else if (segment === 'PRODUCTS') {
        setDetailReport(await api.getProductPerformanceReport(token, fromDate, toDate));
        setCashReceivables(null);
        setCashPayables(null);
      } else if (segment === 'CASH') {
        const [receivables, payables] = await Promise.all([
          api.getReceivablesReport(token),
          api.getPayablesReport(token),
        ]);
        setCashReceivables(receivables);
        setCashPayables(payables);
        setDetailReport(null);
      }
    } catch (err) {
      setDetailReport(null);
      setCashReceivables(null);
      setCashPayables(null);
      setError(err instanceof Error ? err.message : 'Failed to load report details');
    } finally {
      setLoadingDetail(false);
    }
  }, [segment, quickPreset, dateFilter, token]);

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleRefresh = async () => {
    await onRefresh();
    await Promise.all([loadIntelligence(), loadDetail()]);
  };

  const handleQuickPresetChange = (preset: QuickPeriodPreset) => {
    setQuickPreset(preset);
    setDateFilter(quickPresetToDateFilter(preset));
  };

  const showPeriodBar = segment !== 'PULSE' && segment !== 'CASH';

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View style={styles.toolbarCard}>
        <Text style={styles.screenTitle}>Business Intelligence</Text>
        <Text style={styles.screenSubtitle}>
          Forecasts, customer & vendor trends, order metrics, and cash priorities.
        </Text>

        <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />

        {showPeriodBar ? (
          <ReportPeriodBar
            quickPreset={quickPreset}
            dateFilter={dateFilter}
            onQuickPresetChange={handleQuickPresetChange}
            onExtendedFilterApply={setDateFilter}
          />
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {segment === 'PULSE' ? (
        loadingIntel ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Analyzing your business signals...</Text>
          </Card>
        ) : intelligence ? (
          <>
            <HealthScoreCard
              score={intelligence.healthScore}
              label={intelligence.healthLabel}
              summary={intelligence.healthSummary}
            />
            <ForecastStrip forecasts={intelligence.forecasts} />
            <CashFlowOutlookCard outlook={intelligence.cashFlowOutlook} />
            <InsightFeed insights={intelligence.insights} />
            <Card>
              <TrendChart title="Sales trend + forecast" data={intelligence.salesTrend} />
            </Card>
            <Card>
              <TrendChart title="Purchase trend + forecast" data={intelligence.purchaseTrend} />
            </Card>
          </>
        ) : null
      ) : loadingDetail ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </Card>
      ) : segment === 'CASH' && cashReceivables && cashPayables ? (
        <>
          <Card style={styles.sectionCard}>
            <CashLedgerPanel
              title="Receivables"
              subtitle="Who to call first — ranked by outstanding amount, open invoices, and concentration risk."
              report={cashReceivables}
              emptyText="All customer balances are cleared"
            />
          </Card>
          <Card style={styles.sectionCard}>
            <CashLedgerPanel
              title="Payables"
              subtitle="Who to pay and when — ranked by outstanding amount, open bills, and cash impact."
              report={cashPayables}
              emptyText="All vendor balances are cleared"
            />
          </Card>
        </>
      ) : detailReport ? (
        <>
          <ReportSummaryGrid items={detailReport.summary} />
          <Card>
            <TrendChart title={SEGMENT_CHART_TITLE[segment]} data={detailReport.chartData} />
          </Card>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {segment === 'ORDERS' ? 'Period comparison' : 'Detailed breakdown'}
            </Text>
            <ReportTable report={detailReport} />
          </Card>
        </>
      ) : null}
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    toolbarCard: {
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
      gap: 12,
    },
    screenTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(20),
      fontWeight: '800' as const,
    },
    screenSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(14),
      marginBottom: 12,
    },
    loadingCard: {
      alignItems: 'center' as const,
      gap: 12,
      paddingVertical: 32,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
    },
    sectionCard: {
      marginTop: 12,
      gap: 12,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 8,
    },
    sectionHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginBottom: 8,
    },
  };
}
