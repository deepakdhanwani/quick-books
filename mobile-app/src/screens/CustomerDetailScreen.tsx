import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DetailTabBar } from '../components/DetailTabBar';
import { PaymentListFilterChips } from '../components/PaymentListFilterChips';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { ExportingOverlay } from '../components/ExportingOverlay';
import { LedgerExportModal } from '../components/LedgerExportModal';
import { PartyAccountSummary as PartyAccountSummaryBar } from '../components/PartyAccountSummary';
import { PartyLedgerTab } from '../components/PartyLedgerTab';
import { api, Customer, PartyAccountSummary, PartyLedgerEntry, PaymentListFilter, Sale } from '../services/api';
import { LEDGER_PAGE_SIZE } from '../utils/partyLedger';
import { appAlert } from '../utils/appAlert';
import { exportSaleDocument } from '../utils/exportSaleDocument';
import {
  getBusinessNameLabel,
  getCustomerTypeLabel,
  isBusinessCustomerType,
} from '../utils/customerType';
import { formatOpeningBalanceLabel } from '../utils/openingBalance';
import {
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';

const PAGE_SIZE = 20;

type CustomerDetailTab = 'details' | 'invoices' | 'ledger';

const CUSTOMER_DETAIL_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'ledger', label: 'Ledger' },
] as const;

type CustomerDetailScreenProps = {
  token: string;
  customerId: number;
  businessName?: string;
  onEdit: () => void;
  onDeleted: () => void;
  onOpenSale: (saleId: number) => void;
  onCreateReminder: () => void;
};

function getSubtitle(customer: Customer) {
  if (isBusinessCustomerType(customer.customerType) && customer.businessName) {
    return customer.businessName;
  }
  return customer.phone ?? customer.email ?? customer.address ?? 'No contact info';
}

export function CustomerDetailScreen({
  token,
  customerId,
  businessName,
  onEdit,
  onDeleted,
  onOpenSale,
  onCreateReminder,
}: CustomerDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>('details');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [error, setError] = useState('');

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesRefreshing, setSalesRefreshing] = useState(false);
  const [salesError, setSalesError] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentListFilter>('ALL');
  const [salesPage, setSalesPage] = useState(0);
  const [salesHasMore, setSalesHasMore] = useState(true);
  const [salesLoadingMore, setSalesLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const [accountSummary, setAccountSummary] = useState<PartyAccountSummary | null>(null);
  const [accountSummaryLoading, setAccountSummaryLoading] = useState(true);

  const [ledgerEntries, setLedgerEntries] = useState<PartyLedgerEntry[]>([]);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerHasMore, setLedgerHasMore] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerRefreshing, setLedgerRefreshing] = useState(false);
  const [ledgerLoadingMore, setLedgerLoadingMore] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const ledgerLoadingMoreRef = useRef(false);

  const [ledgerExportVisible, setLedgerExportVisible] = useState(false);
  const [saleExporting, setSaleExporting] = useState(false);

  const loadCustomer = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) {
        setLoading(true);
      }
      setError('');
      try {
        const data = await api.getCustomer(token, customerId);
        setCustomer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load customer');
      } finally {
        setLoading(false);
      }
    },
    [customerId, token],
  );

  const fetchSalesPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.listCustomerSales(
        token,
        customerId,
        pageNumber,
        PAGE_SIZE,
        paymentFilter,
      );
      setSales((current) => (reset ? response.content : [...current, ...response.content]));
      setSalesPage(pageNumber);
      setSalesHasMore(pageNumber + 1 < response.totalPages);
    },
    [customerId, paymentFilter, token],
  );

  const loadSales = useCallback(
    async (options?: { pullRefresh?: boolean; loadMore?: boolean }) => {
      const pullRefresh = options?.pullRefresh ?? false;
      const loadMore = options?.loadMore ?? false;

      if (loadMore) {
        if (!salesHasMore || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setSalesLoadingMore(true);
        setSalesError('');
        try {
          await fetchSalesPage(salesPage + 1, false);
        } catch (err) {
          setSalesError(err instanceof Error ? err.message : 'Could not load more invoices');
        } finally {
          loadingMoreRef.current = false;
          setSalesLoadingMore(false);
        }
        return;
      }

      if (!pullRefresh) setSalesLoading(true);
      setSalesError('');
      try {
        await fetchSalesPage(0, true);
      } catch (err) {
        setSales([]);
        setSalesHasMore(false);
        setSalesError(err instanceof Error ? err.message : 'Could not load invoices');
      } finally {
        setSalesLoading(false);
      }
    },
    [fetchSalesPage, salesHasMore, salesPage],
  );

  const loadAccountSummary = useCallback(async () => {
    setAccountSummaryLoading(true);
    try {
      setAccountSummary(await api.getCustomerAccountSummary(token, customerId));
    } catch {
      setAccountSummary(null);
    } finally {
      setAccountSummaryLoading(false);
    }
  }, [customerId, token]);

  const fetchLedgerPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.getCustomerLedger(token, customerId, pageNumber, LEDGER_PAGE_SIZE);
      setAccountSummary(response.summary);
      setLedgerEntries((current) => (reset ? response.content : [...current, ...response.content]));
      setLedgerPage(pageNumber);
      setLedgerHasMore(pageNumber + 1 < response.totalPages);
    },
    [customerId, token],
  );

  const loadLedger = useCallback(
    async (options?: { pullRefresh?: boolean; loadMore?: boolean }) => {
      const pullRefresh = options?.pullRefresh ?? false;
      const loadMore = options?.loadMore ?? false;

      if (loadMore) {
        if (!ledgerHasMore || ledgerLoadingMoreRef.current) return;
        ledgerLoadingMoreRef.current = true;
        setLedgerLoadingMore(true);
        setLedgerError('');
        try {
          await fetchLedgerPage(ledgerPage + 1, false);
        } catch (err) {
          setLedgerError(err instanceof Error ? err.message : 'Could not load more ledger entries');
        } finally {
          ledgerLoadingMoreRef.current = false;
          setLedgerLoadingMore(false);
        }
        return;
      }

      if (!pullRefresh) setLedgerLoading(true);
      setLedgerError('');
      try {
        await fetchLedgerPage(0, true);
      } catch (err) {
        setLedgerEntries([]);
        setLedgerHasMore(false);
        setLedgerError(err instanceof Error ? err.message : 'Could not load ledger');
      } finally {
        setLedgerLoading(false);
      }
    },
    [fetchLedgerPage, ledgerHasMore, ledgerPage],
  );

  useEffect(() => {
    loadCustomer();
    loadAccountSummary();
  }, [loadCustomer, loadAccountSummary]);

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadSales();
    }
  }, [activeTab, paymentFilter, customerId, token]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      loadLedger();
    }
  }, [activeTab, customerId, token, loadLedger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'details') {
      await Promise.all([loadCustomer(true), loadAccountSummary()]);
    } else if (activeTab === 'invoices') {
      setSalesRefreshing(true);
      await loadSales({ pullRefresh: true });
      setSalesRefreshing(false);
    } else {
      setLedgerRefreshing(true);
      await Promise.all([loadLedger({ pullRefresh: true }), loadAccountSummary()]);
      setLedgerRefreshing(false);
    }
    setRefreshing(false);
  };

  const handleToggleActive = async (value: boolean) => {
    if (!customer) return;
    setTogglingActive(true);
    try {
      const updated = await api.setCustomerActive(token, customer.id, value);
      setCustomer(updated);
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleDelete = () => {
    if (!customer) return;

    appAlert('Delete customer', `Delete ${customer.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteCustomer(token, customer.id);
            onDeleted();
          } catch (err) {
            appAlert('Delete failed', err instanceof Error ? err.message : 'Could not delete customer');
          }
        },
      },
    ]);
  };

  if (loading && !customer) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error || 'Customer not found'}</Text>
      </View>
    );
  }

  const avatarColor = customer.active ? theme.colors.success : theme.colors.textSecondary;

  const headerCard = (
    <Card style={styles.headerCard}>
      <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>
          {customer.name.charAt(0).toUpperCase()}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: avatarColor }]} />
      </View>
      <Text style={[styles.name, !customer.active && styles.nameInactive]}>{customer.name}</Text>
      <Text style={styles.subtitle}>{getSubtitle(customer)}</Text>
      <PartyAccountSummaryBar
        mode="customer"
        summary={accountSummary}
        loading={accountSummaryLoading}
      />
    </Card>
  );

  const renderSale = ({ item }: { item: Sale }) => {
    const statusColor = getPaymentStatusColor(item.paymentStatus);
    const statusLabel = getPaymentStatusLabel(item.paymentStatus);
    const invoiceRef = item.invoiceNumber ?? `#${item.id}`;
    const subtitleParts = [formatDate(item.date)];
    if (item.pendingAmount > 0 && item.paymentStatus !== 'PAID') {
      subtitleParts.push(`Due ${formatCurrency(item.pendingAmount)}`);
    }

    return (
      <Pressable
        style={styles.invoiceRow}
        onPress={() => onOpenSale(item.id)}
        onLongPress={() => void handleExportSale(item)}
        delayLongPress={400}
      >
        <View style={[styles.invoiceDot, { backgroundColor: statusColor }]} />
        <View style={styles.invoiceMain}>
          <View style={styles.invoiceTop}>
            <Text style={styles.invoiceNumber} numberOfLines={1}>
              {invoiceRef}
            </Text>
            <Text style={styles.invoiceAmount}>{formatCurrency(item.netAmount)}</Text>
          </View>
          <View style={styles.invoiceBottom}>
            <Text style={styles.invoiceMeta} numberOfLines={1}>
              {subtitleParts.join(' · ')}
            </Text>
            <Text style={[styles.invoiceStatus, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
      </Pressable>
    );
  };

  const handleExportSale = async (sale: Sale) => {
    if (saleExporting) return;
    setSaleExporting(true);
    try {
      const fullSale = await api.getSale(token, sale.id);
      await exportSaleDocument(
        { sale: fullSale, businessName },
        { onPdfReady: () => setSaleExporting(false) },
      );
    } catch (err) {
      appAlert('Export failed', err instanceof Error ? err.message : 'Could not export invoice');
    } finally {
      setSaleExporting(false);
    }
  };

  if (activeTab === 'ledger') {
    return (
      <>
        <PartyLedgerTab
          mode="customer"
          headerCard={headerCard}
          tabBar={
            <DetailTabBar
              tabs={[...CUSTOMER_DETAIL_TABS]}
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab as CustomerDetailTab)}
            />
          }
          entries={ledgerEntries}
          loading={ledgerLoading}
          loadingMore={ledgerLoadingMore}
          error={ledgerError}
          refreshing={ledgerRefreshing}
          onRefresh={async () => {
            setLedgerRefreshing(true);
            await Promise.all([loadLedger({ pullRefresh: true }), loadAccountSummary()]);
            setLedgerRefreshing(false);
          }}
          onLoadMore={() => void loadLedger({ loadMore: true })}
          onOpenReference={onOpenSale}
          onExport={() => setLedgerExportVisible(true)}
          openingDebit={accountSummary?.openingDebit ?? 0}
          openingCredit={accountSummary?.openingCredit ?? 0}
          openingBalance={accountSummary?.openingBalance ?? 0}
        />
        <LedgerExportModal
          visible={ledgerExportVisible}
          token={token}
          mode="customer"
          partyId={customerId}
          partyName={customer.name}
          businessName={businessName}
          onClose={() => setLedgerExportVisible(false)}
        />
      </>
    );
  }

  if (activeTab === 'invoices') {
    return (
      <>
        <View style={styles.container}>
          <FlatList
          data={sales}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSale}
          contentContainerStyle={styles.listContent}
          refreshing={salesRefreshing}
          onRefresh={() => void loadSales({ pullRefresh: true })}
          onEndReached={() => void loadSales({ loadMore: true })}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View>
              {headerCard}
              <DetailTabBar
                tabs={[...CUSTOMER_DETAIL_TABS]}
                activeTab={activeTab}
                onChange={(tab) => setActiveTab(tab as CustomerDetailTab)}
              />
              <PaymentListFilterChips value={paymentFilter} onChange={setPaymentFilter} />
              {salesError ? <Text style={styles.error}>{salesError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            salesLoading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <Card>
                <Text style={styles.emptyTitle}>No invoices found</Text>
                <Text style={styles.emptyHint}>
                  Sales for this customer will appear here.
                </Text>
              </Card>
            )
          }
          ListFooterComponent={
            salesLoadingMore ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
        </View>
        <ExportingOverlay visible={saleExporting} message="Preparing invoice PDF..." />
      </>
    );
  }

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      {headerCard}
      <DetailTabBar
        tabs={[...CUSTOMER_DETAIL_TABS]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as CustomerDetailTab)}
      />

      <Card>
        <DetailRow
          icon="person-outline"
          label="Customer Type"
          value={customer.customerType ? getCustomerTypeLabel(customer.customerType) : undefined}
        />
        {isBusinessCustomerType(customer.customerType) ? (
          <>
            <DetailRow
              icon="business-outline"
              label={getBusinessNameLabel(customer.customerType)}
              value={customer.businessName}
            />
            <DetailRow icon="document-text-outline" label="GST Number" value={customer.gstNumber} />
            {customer.customerType === 'OTHER' ? (
              <DetailRow
                icon="information-circle-outline"
                label="Business Details"
                value={customer.businessDetails}
              />
            ) : null}
          </>
        ) : null}
        {(customer.openingBalance ?? 0) > 0 ? (
          <DetailRow
            icon="wallet-outline"
            label="Opening Balance"
            value={`${formatCurrency(customer.openingBalance ?? 0)} · ${formatOpeningBalanceLabel(
              'customer',
              customer.openingBalanceNature ?? 'TO_RECEIVE',
            )}`}
          />
        ) : null}
        <DetailRow icon="call-outline" label="Phone" value={customer.phone} />
        <DetailRow icon="mail-outline" label="Email" value={customer.email} />
        <DetailRow icon="location-outline" label="Address" value={customer.address} />

        <View style={styles.activeRow}>
          <View>
            <Text style={styles.activeLabel}>Status</Text>
            <Text style={styles.activeHint}>
              {customer.active ? 'Active customer' : 'Inactive customer'}
            </Text>
          </View>
          <Switch
            value={customer.active}
            onValueChange={handleToggleActive}
            disabled={togglingActive}
            trackColor={{ false: theme.colors.border, true: 'rgba(34, 197, 94, 0.35)' }}
            thumbColor={customer.active ? theme.colors.success : theme.colors.textSecondary}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button title="Create Reminder" variant="secondary" onPress={onCreateReminder} />
        <Button title="Edit Customer" onPress={onEdit} />
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          <Text style={styles.deleteText}>Delete Customer</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RefreshableScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  listContent: { padding: 20, paddingBottom: 32 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sectionLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarText: { fontSize: theme.scaleFont(28), fontWeight: '700' },
  statusDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  name: { color: theme.colors.text, fontSize: theme.scaleFont(22), fontWeight: '700' },
  nameInactive: { color: theme.colors.textSecondary },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(14), marginTop: 4 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailText: { flex: 1 },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: { color: theme.colors.text, fontSize: theme.scaleFont(15) },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    gap: 16,
  },
  activeLabel: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600' },
  activeHint: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12), marginTop: 2 },
  actions: { marginTop: 16, gap: 12 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteText: { color: theme.colors.error, fontSize: theme.scaleFont(15), fontWeight: '600' },
  error: { color: theme.colors.error, marginTop: 12, textAlign: 'center' },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  invoiceDot: { width: 8, height: 8, borderRadius: 4 },
  invoiceMain: { flex: 1 },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  invoiceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  invoiceNumber: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600', flex: 1 },
  invoiceAmount: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '700' },
  invoiceMeta: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12), flex: 1 },
  invoiceStatus: { fontSize: theme.scaleFont(12), fontWeight: '600' },
  emptyTitle: { color: theme.colors.text, fontWeight: '700', fontSize: theme.scaleFont(15) },
  emptyHint: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13), marginTop: 6 },
  footerLoader: { marginVertical: 16 },

  };
}
