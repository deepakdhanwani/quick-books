import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { ReportChart } from '../components/ReportChart';
import { ReportTable } from '../components/ReportTable';
import { Select } from '../components/Select';
import { AdminReport, api, BusinessType, SubscriptionPlan } from '../services/api';
import { colors } from '../theme/colors';
import { exportReportCsv, exportReportPdf } from '../utils/exportReport';
import { parseOptionalDate } from '../utils/discount';

type ReportsScreenProps = {
  token: string;
};

type ReportTab = 'REVENUE' | 'PENDING' | 'EXPIRING' | 'BUSINESS_TYPE';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'REVENUE', label: 'Revenue' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'EXPIRING', label: 'Expiring' },
  { id: 'BUSINESS_TYPE', label: 'Business Types' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function ReportsScreen({ token }: ReportsScreenProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('REVENUE');
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const [fromDate, setFromDate] = useState(monthStartIso());
  const [toDate, setToDate] = useState(todayIso());
  const [withinDays, setWithinDays] = useState('30');
  const [planId, setPlanId] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('');

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  const planOptions = useMemo(
    () => [{ label: 'All plans', value: '' }, ...plans.map((plan) => ({ label: plan.name, value: String(plan.id) }))],
    [plans],
  );

  const businessTypeOptions = useMemo(
    () => [
      { label: 'All business types', value: '' },
      ...businessTypes.map((type) => ({ label: type.name, value: String(type.id) })),
    ],
    [businessTypes],
  );

  const loadFilters = useCallback(async () => {
    try {
      const [planData, typeData] = await Promise.all([
        api.getActiveSubscriptionPlans(token),
        api.getActiveBusinessTypes(token),
      ]);
      setPlans(planData);
      setBusinessTypes(typeData);
    } catch {
      // Filter dropdowns are optional; report can still load.
    }
  }, [token]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data: AdminReport;
      if (activeTab === 'REVENUE') {
        const from = parseOptionalDate(fromDate);
        const to = parseOptionalDate(toDate);
        data = await api.getRevenueReport(token, {
          from,
          to,
          planId: planId ? Number(planId) : undefined,
          businessTypeId: businessTypeId ? Number(businessTypeId) : undefined,
        });
      } else if (activeTab === 'PENDING') {
        data = await api.getPendingSubscriptionsReport(token);
      } else if (activeTab === 'EXPIRING') {
        const days = Number(withinDays);
        if (!Number.isFinite(days) || days < 1) {
          throw new Error('Enter a valid number of days');
        }
        data = await api.getExpiringSubscriptionsReport(token, days);
      } else {
        const from = parseOptionalDate(fromDate);
        const to = parseOptionalDate(toDate);
        data = await api.getBusinessTypeBreakdownReport(token, { from, to });
      }
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token, fromDate, toDate, withinDays, planId, businessTypeId]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCsv = async () => {
    if (!report) return;
    setExporting('csv');
    setError('');
    try {
      exportReportCsv(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setExporting('pdf');
    setError('');
    try {
      exportReportPdf(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setExporting(null);
    }
  };

  const chartPrefix = activeTab === 'REVENUE' || activeTab === 'BUSINESS_TYPE' ? '₹' : '';
  const chartTitle =
    activeTab === 'REVENUE'
      ? 'Revenue by Month'
      : activeTab === 'PENDING'
        ? 'Pending by Business Type'
        : activeTab === 'EXPIRING'
          ? 'Expiring by Plan'
          : 'Revenue by Business Type';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="Reports"
        subtitle="Platform revenue and subscription analytics"
        action={
          <View style={styles.headerActions}>
            <Button
              title="Export CSV"
              variant="secondary"
              onPress={handleExportCsv}
              loading={exporting === 'csv'}
              disabled={!report || loading}
            />
            <Button
              title="Export PDF"
              variant="secondary"
              onPress={handleExportPdf}
              loading={exporting === 'pdf'}
              disabled={!report || loading}
            />
          </View>
        }
      />

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {(activeTab === 'REVENUE' || activeTab === 'BUSINESS_TYPE' || activeTab === 'EXPIRING') ? (
        <Card>
          <Text style={styles.filtersTitle}>Filters</Text>
          <View style={[styles.filtersRow, styles.filtersRowPrimary]}>
            {(activeTab === 'REVENUE' || activeTab === 'BUSINESS_TYPE') ? (
              <>
                <View style={styles.filterField}>
                  <Input label="From" value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
                </View>
                <View style={styles.filterField}>
                  <Input label="To" value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
                </View>
              </>
            ) : (
              <View style={styles.filterField}>
                <Input
                  label="Within Days"
                  value={withinDays}
                  onChangeText={setWithinDays}
                  keyboardType="number-pad"
                  placeholder="e.g. 30"
                />
              </View>
            )}
            {activeTab === 'REVENUE' ? (
              <>
                <View style={styles.filterField}>
                  <Select label="Plan" value={planId} options={planOptions} onChange={setPlanId} />
                </View>
                <View style={styles.filterField}>
                  <Select
                    label="Business Type"
                    value={businessTypeId}
                    options={businessTypeOptions}
                    onChange={setBusinessTypeId}
                  />
                </View>
              </>
            ) : null}
          </View>
          <Button title="Apply Filters" onPress={loadReport} loading={loading} />
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <Card>
          <ActivityIndicator color={colors.primary} />
        </Card>
      ) : report ? (
        <>
          {report.summary.length > 0 ? (
            <View style={styles.summaryGrid}>
              {report.summary.map((item) => (
                <View key={item.label} style={styles.summaryItem}>
                  <Card>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                    <Text style={styles.summaryValue}>
                      {item.label.toLowerCase().includes('revenue') || item.label.toLowerCase().includes('tax')
                        ? `₹${Number(item.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : item.value}
                    </Text>
                  </Card>
                </View>
              ))}
            </View>
          ) : null}

          <Card style={styles.reportCard}>
            <ReportChart title={chartTitle} data={report.chartData} valuePrefix={chartPrefix} />
          </Card>

          <Card style={styles.reportCard}>
            <ReportTable report={report} />
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: { paddingBottom: 32 },
  headerActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  filtersTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'visible',
  },
  filtersRowPrimary: {
    zIndex: 4,
  },
  filterField: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 200,
    overflow: 'visible',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 8,
  },
  summaryItem: {
    width: '25%',
    minWidth: 180,
    padding: 8,
    flexGrow: 1,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  reportCard: {
    marginTop: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  error: {
    color: colors.error,
    marginBottom: 16,
  },
});
