import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { DataTable } from './DataTable';
import { Input } from './Input';
import { Pagination } from './Pagination';
import { ReportChart } from './ReportChart';
import { ReportTable } from './ReportTable';
import { Select } from './Select';
import {
  AdminReport,
  api,
  PageResponse,
  PaymentListFilter,
  SubscriberAuditLog,
  SubscriberCustomer,
  SubscriberDataSummary,
  SubscriberProduct,
  SubscriberPurchase,
  SubscriberSale,
  SubscriberTeamUser,
  SubscriberVendor,
} from '../services/api';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { parseOptionalDate } from '../utils/discount';

export type SubscriberDataTab =
  | 'OVERVIEW'
  | 'CUSTOMERS'
  | 'VENDORS'
  | 'PRODUCTS'
  | 'SALES'
  | 'PURCHASES'
  | 'TEAM'
  | 'ACTIVITY'
  | 'REPORTS';

export const SUBSCRIBER_DATA_TABS: { id: SubscriberDataTab; label: string }[] = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'CUSTOMERS', label: 'Customers' },
  { id: 'VENDORS', label: 'Vendors' },
  { id: 'PRODUCTS', label: 'Products' },
  { id: 'SALES', label: 'Sales' },
  { id: 'PURCHASES', label: 'Purchases' },
  { id: 'TEAM', label: 'Team' },
  { id: 'ACTIVITY', label: 'Activity' },
  { id: 'REPORTS', label: 'Reports' },
];

type SubscriberDataPanelProps = {
  token: string;
  subscriberId: number;
  companyId?: number;
  tab: Exclude<SubscriberDataTab, 'OVERVIEW'>;
};

type ReportSubTab = 'SALES' | 'PURCHASES' | 'SUMMARY';

const ACTIVE_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Active only', value: 'true' },
  { label: 'Inactive only', value: 'false' },
];

const PAYMENT_FILTER_OPTIONS = [
  { label: 'All payments', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
];

const REPORT_TABS: { id: ReportSubTab; label: string }[] = [
  { id: 'SALES', label: 'Sales' },
  { id: 'PURCHASES', label: 'Purchases' },
  { id: 'SUMMARY', label: 'Business Summary' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function paymentBadgeVariant(status: string): 'success' | 'warning' | 'error' {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'error';
}

function parseActiveFilter(value: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

type PaginatedListState<T> = {
  rows: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
};

const EMPTY_PAGE: PaginatedListState<never> = {
  rows: [],
  page: 0,
  pageSize: 20,
  totalPages: 0,
  totalElements: 0,
};

export function SubscriberOverviewSummary({
  summary,
  loading,
  onNavigate,
}: {
  summary: SubscriberDataSummary | null;
  loading: boolean;
  onNavigate?: (tab: SubscriberDataTab) => void;
}) {
  if (loading) {
    return (
      <Card style={styles.summaryCard}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  if (!summary) return null;

  const tiles: { label: string; value: string; tab?: SubscriberDataTab }[] = [
    { label: 'Customers', value: String(summary.customerCount), tab: 'CUSTOMERS' },
    { label: 'Vendors', value: String(summary.vendorCount), tab: 'VENDORS' },
    { label: 'Products', value: String(summary.productCount), tab: 'PRODUCTS' },
    { label: 'Sales Orders', value: String(summary.saleCount), tab: 'SALES' },
    { label: 'Purchase Orders', value: String(summary.purchaseCount), tab: 'PURCHASES' },
    { label: 'Team Users', value: String(summary.teamUserCount), tab: 'TEAM' },
    { label: 'Total Sales', value: formatCurrency(summary.totalSalesAmount) },
    { label: 'Total Purchases', value: formatCurrency(summary.totalPurchasesAmount) },
    { label: 'Pending Receivables', value: formatCurrency(summary.pendingSalesAmount) },
    { label: 'Pending Payables', value: formatCurrency(summary.pendingPurchasesAmount) },
    { label: 'Activity Logs', value: String(summary.auditLogCount), tab: 'ACTIVITY' },
  ];

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.panelTitle}>Business Snapshot</Text>
      <Text style={styles.panelSubtitle}>Counts and financial totals for this subscriber</Text>
      <View style={styles.summaryGrid}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.summaryTile}>
            <Text style={styles.summaryLabel}>{tile.label}</Text>
            <Text style={styles.summaryValue}>{tile.value}</Text>
            {tile.tab && onNavigate ? (
              <Button title="View" variant="secondary" onPress={() => onNavigate(tile.tab!)} />
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
}

export function SubscriberDataPanel({ token, subscriberId, companyId, tab }: SubscriberDataPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentListFilter>('ALL');
  const [fromDate, setFromDate] = useState(monthStartIso());
  const [toDate, setToDate] = useState(todayIso());

  const [customers, setCustomers] = useState<PaginatedListState<SubscriberCustomer>>(EMPTY_PAGE);
  const [vendors, setVendors] = useState<PaginatedListState<SubscriberVendor>>(EMPTY_PAGE);
  const [products, setProducts] = useState<PaginatedListState<SubscriberProduct>>(EMPTY_PAGE);
  const [sales, setSales] = useState<PaginatedListState<SubscriberSale>>(EMPTY_PAGE);
  const [purchases, setPurchases] = useState<PaginatedListState<SubscriberPurchase>>(EMPTY_PAGE);
  const [teamUsers, setTeamUsers] = useState<SubscriberTeamUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<PaginatedListState<SubscriberAuditLog>>(EMPTY_PAGE);

  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('SALES');
  const [report, setReport] = useState<AdminReport | null>(null);
  const [reportFromDate, setReportFromDate] = useState(monthStartIso());
  const [reportToDate, setReportToDate] = useState(todayIso());

  const applyListFilters = () => {
    setSearch(searchInput.trim());
    setPage(0);
  };

  const updatePageState = <T,>(setState: (value: PaginatedListState<T>) => void, data: PageResponse<T>) => {
    setState({
      rows: data.content,
      page: data.page,
      pageSize: data.size,
      totalPages: data.totalPages,
      totalElements: data.totalElements,
    });
  };

  const loadData = useCallback(async () => {
    if (companyId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (tab === 'CUSTOMERS') {
        const data = await api.getSubscriberCustomers(token, subscriberId, {
          companyId,
          page,
          size: pageSize,
          search: search || undefined,
          active: parseActiveFilter(activeFilter),
        });
        updatePageState(setCustomers, data);
      } else if (tab === 'VENDORS') {
        const data = await api.getSubscriberVendors(token, subscriberId, {
          companyId,
          page,
          size: pageSize,
          search: search || undefined,
          active: parseActiveFilter(activeFilter),
        });
        updatePageState(setVendors, data);
      } else if (tab === 'PRODUCTS') {
        const data = await api.getSubscriberProducts(token, subscriberId, {
          companyId,
          page,
          size: pageSize,
          search: search || undefined,
          active: parseActiveFilter(activeFilter),
        });
        updatePageState(setProducts, data);
      } else if (tab === 'SALES') {
        const data = await api.getSubscriberSales(token, subscriberId, {
          companyId,
          page,
          size: pageSize,
          search: search || undefined,
          paymentFilter: paymentFilter === 'ALL' ? undefined : paymentFilter,
          fromDate: parseOptionalDate(fromDate),
          toDate: parseOptionalDate(toDate),
        });
        updatePageState(setSales, data);
      } else if (tab === 'PURCHASES') {
        const data = await api.getSubscriberPurchases(token, subscriberId, {
          companyId,
          page,
          size: pageSize,
          search: search || undefined,
          paymentFilter: paymentFilter === 'ALL' ? undefined : paymentFilter,
          fromDate: parseOptionalDate(fromDate),
          toDate: parseOptionalDate(toDate),
        });
        updatePageState(setPurchases, data);
      } else if (tab === 'TEAM') {
        const data = await api.getSubscriberTeamUsers(token, subscriberId);
        setTeamUsers(data);
      } else if (tab === 'ACTIVITY') {
        const data = await api.getSubscriberAuditLogs(token, subscriberId, page, pageSize);
        updatePageState(setAuditLogs, data);
      } else if (tab === 'REPORTS') {
        const from = parseOptionalDate(reportFromDate);
        const to = parseOptionalDate(reportToDate);
        let data: AdminReport;
        if (reportSubTab === 'SALES') {
          data = await api.getSubscriberSalesReport(token, subscriberId, { companyId, from, to });
        } else if (reportSubTab === 'PURCHASES') {
          data = await api.getSubscriberPurchasesReport(token, subscriberId, { companyId, from, to });
        } else {
          data = await api.getSubscriberBusinessSummaryReport(token, subscriberId, { companyId, from, to });
        }
        setReport(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    token,
    subscriberId,
    companyId,
    page,
    pageSize,
    search,
    activeFilter,
    paymentFilter,
    fromDate,
    toDate,
    reportSubTab,
    reportFromDate,
    reportToDate,
  ]);

  useEffect(() => {
    setPage(0);
    setSearch('');
    setSearchInput('');
    setActiveFilter('');
    setPaymentFilter('ALL');
    setFromDate(monthStartIso());
    setToDate(todayIso());
    setError('');
  }, [tab, companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const paginationProps = useMemo(() => {
    if (tab === 'CUSTOMERS') {
      return { ...customers, onPageChange: setPage, onPageSizeChange: (size: number) => { setPageSize(size); setPage(0); } };
    }
    if (tab === 'VENDORS') {
      return { ...vendors, onPageChange: setPage, onPageSizeChange: (size: number) => { setPageSize(size); setPage(0); } };
    }
    if (tab === 'PRODUCTS') {
      return { ...products, onPageChange: setPage, onPageSizeChange: (size: number) => { setPageSize(size); setPage(0); } };
    }
    if (tab === 'SALES') {
      return { ...sales, onPageChange: setPage, onPageSizeChange: (size: number) => { setPageSize(size); setPage(0); } };
    }
    if (tab === 'PURCHASES') {
      return { ...purchases, onPageChange: setPage, onPageSizeChange: (size: number) => { setPageSize(size); setPage(0); } };
    }
    if (tab === 'ACTIVITY') {
      return { ...auditLogs, onPageChange: setPage, onPageSizeChange: (size: number) => { setPageSize(size); setPage(0); } };
    }
    return null;
  }, [tab, customers, vendors, products, sales, purchases, auditLogs]);

  const showEntityFilters = tab === 'CUSTOMERS' || tab === 'VENDORS' || tab === 'PRODUCTS';
  const showTransactionFilters = tab === 'SALES' || tab === 'PURCHASES';

  return (
    <View style={styles.panel}>
      {showEntityFilters ? (
        <Card style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <View style={styles.filtersRow}>
            <View style={styles.filterFieldWide}>
              <Input
                label="Search"
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Name, phone, email..."
              />
            </View>
            <View style={styles.filterField}>
              <Select label="Status" value={activeFilter} options={ACTIVE_FILTER_OPTIONS} onChange={setActiveFilter} />
            </View>
          </View>
          <Button title="Apply Filters" onPress={applyListFilters} loading={loading} />
        </Card>
      ) : null}

      {showTransactionFilters ? (
        <Card style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <View style={styles.filtersRow}>
            <View style={styles.filterFieldWide}>
              <Input
                label="Search"
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Invoice, customer, notes..."
              />
            </View>
            <View style={styles.filterField}>
              <Select
                label="Payment"
                value={paymentFilter}
                options={PAYMENT_FILTER_OPTIONS}
                onChange={(value) => setPaymentFilter(value as PaymentListFilter)}
              />
            </View>
            <View style={styles.filterField}>
              <Input label="From" value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.filterField}>
              <Input label="To" value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>
          <Button title="Apply Filters" onPress={applyListFilters} loading={loading} />
        </Card>
      ) : null}

      {tab === 'REPORTS' ? (
        <Card style={styles.filtersCard}>
          <View style={styles.reportTabs}>
            {REPORT_TABS.map((item) => (
              <Button
                key={item.id}
                title={item.label}
                variant={reportSubTab === item.id ? 'primary' : 'secondary'}
                onPress={() => setReportSubTab(item.id)}
              />
            ))}
          </View>
          <View style={styles.filtersRow}>
            <View style={styles.filterField}>
              <Input label="From" value={reportFromDate} onChangeText={setReportFromDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.filterField}>
              <Input label="To" value={reportToDate} onChangeText={setReportToDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>
          <Button title="Generate Report" onPress={loadData} loading={loading} />
        </Card>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <Card>
          <ActivityIndicator color={colors.primary} />
        </Card>
      ) : (
        <>
          {tab === 'CUSTOMERS' ? (
            <Card>
              <Text style={styles.panelTitle}>Customers</Text>
              <DataTable
                columns={[
                  { key: 'name', label: 'Name', flex: 1.2 },
                  { key: 'phone', label: 'Phone' },
                  { key: 'customerType', label: 'Type' },
                  {
                    key: 'totalPendingAmount',
                    label: 'Pending',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.totalPendingAmount)}</Text>,
                  },
                  {
                    key: 'active',
                    label: 'Status',
                    render: (row) => (
                      <Badge label={row.active ? 'Active' : 'Inactive'} variant={row.active ? 'success' : 'error'} />
                    ),
                  },
                ]}
                rows={customers.rows}
                keyExtractor={(row) => row.id}
              />
            </Card>
          ) : null}

          {tab === 'VENDORS' ? (
            <Card>
              <Text style={styles.panelTitle}>Vendors</Text>
              <DataTable
                columns={[
                  { key: 'name', label: 'Name', flex: 1.2 },
                  { key: 'contactPerson', label: 'Contact' },
                  { key: 'phone', label: 'Phone' },
                  {
                    key: 'totalPendingAmount',
                    label: 'Pending',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.totalPendingAmount)}</Text>,
                  },
                  {
                    key: 'active',
                    label: 'Status',
                    render: (row) => (
                      <Badge label={row.active ? 'Active' : 'Inactive'} variant={row.active ? 'success' : 'error'} />
                    ),
                  },
                ]}
                rows={vendors.rows}
                keyExtractor={(row) => row.id}
              />
            </Card>
          ) : null}

          {tab === 'PRODUCTS' ? (
            <Card>
              <Text style={styles.panelTitle}>Products</Text>
              <DataTable
                columns={[
                  { key: 'name', label: 'Name', flex: 1.5 },
                  {
                    key: 'sellingPrice',
                    label: 'Price',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.sellingPrice)}</Text>,
                  },
                  {
                    key: 'discount',
                    label: 'Discount',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.discount)}</Text>,
                  },
                  {
                    key: 'netAmount',
                    label: 'Net',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.netAmount)}</Text>,
                  },
                  {
                    key: 'active',
                    label: 'Status',
                    render: (row) => (
                      <Badge label={row.active ? 'Active' : 'Inactive'} variant={row.active ? 'success' : 'error'} />
                    ),
                  },
                ]}
                rows={products.rows}
                keyExtractor={(row) => row.id}
              />
            </Card>
          ) : null}

          {tab === 'SALES' ? (
            <Card>
              <Text style={styles.panelTitle}>Sales Orders</Text>
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: (row) => <Text style={styles.cellText}>{formatDate(row.date)}</Text> },
                  { key: 'invoiceNumber', label: 'Invoice', flex: 1 },
                  { key: 'customerName', label: 'Customer', flex: 1.2 },
                  {
                    key: 'netAmount',
                    label: 'Amount',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.netAmount)}</Text>,
                  },
                  {
                    key: 'pendingAmount',
                    label: 'Pending',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.pendingAmount)}</Text>,
                  },
                  {
                    key: 'paymentStatus',
                    label: 'Payment',
                    render: (row) => (
                      <Badge label={row.paymentStatus} variant={paymentBadgeVariant(row.paymentStatus)} />
                    ),
                  },
                ]}
                rows={sales.rows}
                keyExtractor={(row) => row.id}
              />
            </Card>
          ) : null}

          {tab === 'PURCHASES' ? (
            <Card>
              <Text style={styles.panelTitle}>Purchase Orders</Text>
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', render: (row) => <Text style={styles.cellText}>{formatDate(row.date)}</Text> },
                  { key: 'billNumber', label: 'Bill', flex: 1 },
                  { key: 'vendorName', label: 'Vendor', flex: 1.2 },
                  {
                    key: 'netAmount',
                    label: 'Amount',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.netAmount)}</Text>,
                  },
                  {
                    key: 'pendingAmount',
                    label: 'Pending',
                    align: 'right',
                    render: (row) => <Text style={styles.cellText}>{formatCurrency(row.pendingAmount)}</Text>,
                  },
                  {
                    key: 'paymentStatus',
                    label: 'Payment',
                    render: (row) => (
                      <Badge label={row.paymentStatus} variant={paymentBadgeVariant(row.paymentStatus)} />
                    ),
                  },
                ]}
                rows={purchases.rows}
                keyExtractor={(row) => row.id}
              />
            </Card>
          ) : null}

          {tab === 'TEAM' ? (
            <Card>
              <Text style={styles.panelTitle}>Team Users</Text>
              <DataTable
                columns={[
                  { key: 'name', label: 'Name', flex: 1.2 },
                  { key: 'loginPin', label: 'Login PIN' },
                  {
                    key: 'createdAt',
                    label: 'Added',
                    render: (row) => <Text style={styles.cellText}>{formatDateTime(row.createdAt)}</Text>,
                  },
                  {
                    key: 'active',
                    label: 'Status',
                    render: (row) => (
                      <Badge label={row.active ? 'Active' : 'Inactive'} variant={row.active ? 'success' : 'error'} />
                    ),
                  },
                ]}
                rows={teamUsers}
                keyExtractor={(row) => row.id}
                emptyText="No team users — only the owner account exists"
              />
            </Card>
          ) : null}

          {tab === 'ACTIVITY' ? (
            <Card>
              <Text style={styles.panelTitle}>Activity Log</Text>
              <DataTable
                columns={[
                  {
                    key: 'createdAt',
                    label: 'When',
                    flex: 1.1,
                    render: (row) => <Text style={styles.cellText}>{formatDateTime(row.createdAt)}</Text>,
                  },
                  { key: 'actorName', label: 'Actor' },
                  { key: 'action', label: 'Action' },
                  { key: 'entityType', label: 'Entity' },
                  { key: 'details', label: 'Details', flex: 1.5 },
                ]}
                rows={auditLogs.rows}
                keyExtractor={(row) => row.id}
              />
            </Card>
          ) : null}

          {tab === 'REPORTS' && report ? (
            <>
              {report.summary.length > 0 ? (
                <View style={styles.reportSummaryGrid}>
                  {report.summary.map((item) => (
                    <View key={item.label} style={styles.reportSummaryItem}>
                      <Card>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={styles.summaryValue}>
                          {item.label.toLowerCase().includes('amount') ||
                          item.label.toLowerCase().includes('revenue') ||
                          item.label.toLowerCase().includes('sales') ||
                          item.label.toLowerCase().includes('purchase')
                            ? formatCurrency(item.value)
                            : item.value}
                        </Text>
                      </Card>
                    </View>
                  ))}
                </View>
              ) : null}
              <Card style={styles.reportCard}>
                <ReportChart title={report.title} data={report.chartData} valuePrefix="₹" />
              </Card>
              <Card style={styles.reportCard}>
                <ReportTable report={report} />
              </Card>
            </>
          ) : null}

          {paginationProps ? (
            <Pagination
              page={paginationProps.page}
              pageSize={paginationProps.pageSize}
              totalPages={paginationProps.totalPages}
              totalElements={paginationProps.totalElements}
              onPageChange={paginationProps.onPageChange}
              onPageSizeChange={paginationProps.onPageSizeChange}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 16, width: '100%' },
  summaryCard: { gap: 12 },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  panelSubtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryTile: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 180,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  filtersCard: { gap: 12 },
  filtersTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  filterField: { flexGrow: 1, flexBasis: 180, minWidth: 160 },
  filterFieldWide: { flexGrow: 2, flexBasis: 280, minWidth: 220 },
  reportTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  reportSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  reportSummaryItem: { flexGrow: 1, flexBasis: 200, minWidth: 180 },
  reportCard: { marginTop: 0 },
  cellText: { color: colors.text, fontSize: 14 },
  errorText: { color: colors.error, fontSize: 14, lineHeight: 20 },
});
