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
import { api, PartyAccountSummary, PartyLedgerEntry, PaymentListFilter, Purchase, Vendor } from '../services/api';
import { LEDGER_PAGE_SIZE } from '../utils/partyLedger';
import { appAlert } from '../utils/appAlert';
import { exportPurchaseDocument } from '../utils/exportPurchaseDocument';
import { formatOpeningBalanceLabel } from '../utils/openingBalance';
import {
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';
import { getVendorDisplayName } from '../utils/vendorType';

const PAGE_SIZE = 20;

type VendorDetailTab = 'details' | 'purchases' | 'ledger';

const VENDOR_DETAIL_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'ledger', label: 'Ledger' },
] as const;

type VendorDetailScreenProps = {
  token: string;
  vendorId: number;
  businessName?: string;
  onEdit: () => void;
  onDeleted: () => void;
  onOpenPurchase: (purchaseId: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

function getSubtitle(vendor: Vendor) {
  return vendor.contactPerson ?? vendor.phone ?? vendor.email ?? 'No contact info';
}

export function VendorDetailScreen({
  token,
  vendorId,
  businessName,
  onEdit,
  onDeleted,
  onOpenPurchase,
  canEdit = true,
  canDelete = true,
}: VendorDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<VendorDetailTab>('details');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [error, setError] = useState('');

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesRefreshing, setPurchasesRefreshing] = useState(false);
  const [purchasesError, setPurchasesError] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentListFilter>('ALL');
  const [purchasesPage, setPurchasesPage] = useState(0);
  const [purchasesHasMore, setPurchasesHasMore] = useState(true);
  const [purchasesLoadingMore, setPurchasesLoadingMore] = useState(false);
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
  const [purchaseExporting, setPurchaseExporting] = useState(false);

  const loadVendor = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) {
        setLoading(true);
      }
      setError('');
      try {
        const data = await api.getVendor(token, vendorId);
        setVendor(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load vendor');
      } finally {
        setLoading(false);
      }
    },
    [token, vendorId],
  );

  const fetchPurchasesPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.listVendorPurchases(
        token,
        vendorId,
        pageNumber,
        PAGE_SIZE,
        paymentFilter,
      );
      setPurchases((current) => (reset ? response.content : [...current, ...response.content]));
      setPurchasesPage(pageNumber);
      setPurchasesHasMore(pageNumber + 1 < response.totalPages);
    },
    [paymentFilter, token, vendorId],
  );

  const loadPurchases = useCallback(
    async (options?: { pullRefresh?: boolean; loadMore?: boolean }) => {
      const pullRefresh = options?.pullRefresh ?? false;
      const loadMore = options?.loadMore ?? false;

      if (loadMore) {
        if (!purchasesHasMore || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setPurchasesLoadingMore(true);
        setPurchasesError('');
        try {
          await fetchPurchasesPage(purchasesPage + 1, false);
        } catch (err) {
          setPurchasesError(err instanceof Error ? err.message : 'Could not load more purchases');
        } finally {
          loadingMoreRef.current = false;
          setPurchasesLoadingMore(false);
        }
        return;
      }

      if (!pullRefresh) setPurchasesLoading(true);
      setPurchasesError('');
      try {
        await fetchPurchasesPage(0, true);
      } catch (err) {
        setPurchases([]);
        setPurchasesHasMore(false);
        setPurchasesError(err instanceof Error ? err.message : 'Could not load purchases');
      } finally {
        setPurchasesLoading(false);
      }
    },
    [fetchPurchasesPage, purchasesHasMore, purchasesPage],
  );

  const loadAccountSummary = useCallback(async () => {
    setAccountSummaryLoading(true);
    try {
      setAccountSummary(await api.getVendorAccountSummary(token, vendorId));
    } catch {
      setAccountSummary(null);
    } finally {
      setAccountSummaryLoading(false);
    }
  }, [token, vendorId]);

  const fetchLedgerPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.getVendorLedger(token, vendorId, pageNumber, LEDGER_PAGE_SIZE);
      setAccountSummary(response.summary);
      setLedgerEntries((current) => (reset ? response.content : [...current, ...response.content]));
      setLedgerPage(pageNumber);
      setLedgerHasMore(pageNumber + 1 < response.totalPages);
    },
    [token, vendorId],
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
    loadVendor();
    loadAccountSummary();
  }, [loadVendor, loadAccountSummary]);

  useEffect(() => {
    if (activeTab === 'purchases') {
      loadPurchases();
    }
  }, [activeTab, paymentFilter, vendorId, token]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      loadLedger();
    }
  }, [activeTab, vendorId, token, loadLedger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'details') {
      await Promise.all([loadVendor(true), loadAccountSummary()]);
    } else if (activeTab === 'purchases') {
      setPurchasesRefreshing(true);
      await loadPurchases({ pullRefresh: true });
      setPurchasesRefreshing(false);
    } else {
      setLedgerRefreshing(true);
      await Promise.all([loadLedger({ pullRefresh: true }), loadAccountSummary()]);
      setLedgerRefreshing(false);
    }
    setRefreshing(false);
  };

  const handleToggleActive = async (value: boolean) => {
    if (!vendor) return;
    setTogglingActive(true);
    try {
      const updated = await api.setVendorActive(token, vendor.id, value);
      setVendor(updated);
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleDelete = () => {
    if (!vendor) return;

    appAlert('Delete vendor', `Delete ${getVendorDisplayName(vendor)}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteVendor(token, vendor.id);
            onDeleted();
          } catch (err) {
            appAlert('Delete failed', err instanceof Error ? err.message : 'Could not delete vendor');
          }
        },
      },
    ]);
  };

  if (loading && !vendor) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error || 'Vendor not found'}</Text>
      </View>
    );
  }

  const avatarColor = vendor.active ? theme.colors.success : theme.colors.textSecondary;
  const displayName = getVendorDisplayName(vendor);

  const headerCard = (
    <Card style={styles.headerCard}>
      <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: avatarColor }]} />
      </View>
      <Text style={[styles.name, !vendor.active && styles.nameInactive]}>{displayName}</Text>
      <Text style={styles.subtitle}>{getSubtitle(vendor)}</Text>
      <PartyAccountSummaryBar mode="vendor" summary={accountSummary} loading={accountSummaryLoading} />
    </Card>
  );

  const renderPurchase = ({ item }: { item: Purchase }) => {
    const statusColor = getPaymentStatusColor(item.paymentStatus);
    const statusLabel = getPaymentStatusLabel(item.paymentStatus);
    const billRef = item.billNumber ?? `#${item.id}`;
    const subtitleParts = [formatDate(item.date)];
    if (item.pendingAmount > 0 && item.paymentStatus !== 'PAID') {
      subtitleParts.push(`Due ${formatCurrency(item.pendingAmount)}`);
    }

    return (
      <Pressable
        style={styles.orderRow}
        onPress={() => onOpenPurchase(item.id)}
        onLongPress={() => void handleExportPurchase(item)}
        delayLongPress={400}
      >
        <View style={[styles.orderDot, { backgroundColor: statusColor }]} />
        <View style={styles.orderMain}>
          <View style={styles.orderTop}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {billRef}
            </Text>
            <Text style={styles.orderAmount}>{formatCurrency(item.netAmount)}</Text>
          </View>
          <View style={styles.orderBottom}>
            <Text style={styles.orderMeta} numberOfLines={1}>
              {subtitleParts.join(' · ')}
            </Text>
            <Text style={[styles.orderStatus, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
      </Pressable>
    );
  };

  const handleExportPurchase = async (purchase: Purchase) => {
    if (purchaseExporting) return;
    setPurchaseExporting(true);
    try {
      const fullPurchase = await api.getPurchase(token, purchase.id);
      await exportPurchaseDocument(
        { purchase: fullPurchase, businessName },
        { onPdfReady: () => setPurchaseExporting(false) },
      );
    } catch (err) {
      appAlert('Export failed', err instanceof Error ? err.message : 'Could not export purchase order');
    } finally {
      setPurchaseExporting(false);
    }
  };

  if (activeTab === 'ledger') {
    return (
      <>
        <PartyLedgerTab
          mode="vendor"
          headerCard={headerCard}
          tabBar={
            <DetailTabBar
              tabs={[...VENDOR_DETAIL_TABS]}
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab as VendorDetailTab)}
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
          onOpenReference={onOpenPurchase}
          onExport={() => setLedgerExportVisible(true)}
          openingDebit={accountSummary?.openingDebit ?? 0}
          openingCredit={accountSummary?.openingCredit ?? 0}
          openingBalance={accountSummary?.openingBalance ?? 0}
        />
        <LedgerExportModal
          visible={ledgerExportVisible}
          token={token}
          mode="vendor"
          partyId={vendorId}
          partyName={displayName}
          businessName={businessName}
          onClose={() => setLedgerExportVisible(false)}
        />
      </>
    );
  }

  if (activeTab === 'purchases') {
    return (
      <>
        <View style={styles.container}>
          <FlatList
          data={purchases}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPurchase}
          contentContainerStyle={styles.listContent}
          refreshing={purchasesRefreshing}
          onRefresh={() => void loadPurchases({ pullRefresh: true })}
          onEndReached={() => void loadPurchases({ loadMore: true })}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View>
              {headerCard}
              <DetailTabBar
                tabs={[...VENDOR_DETAIL_TABS]}
                activeTab={activeTab}
                onChange={(tab) => setActiveTab(tab as VendorDetailTab)}
              />
              <PaymentListFilterChips value={paymentFilter} onChange={setPaymentFilter} />
              {purchasesError ? <Text style={styles.error}>{purchasesError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            purchasesLoading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <Card>
                <Text style={styles.emptyTitle}>No purchases found</Text>
                <Text style={styles.emptyHint}>
                  Purchase orders for this vendor will appear here.
                </Text>
              </Card>
            )
          }
          ListFooterComponent={
            purchasesLoadingMore ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
        </View>
        <ExportingOverlay visible={purchaseExporting} message="Preparing purchase PDF..." />
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
        tabs={[...VENDOR_DETAIL_TABS]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as VendorDetailTab)}
      />

      <Card>
        <Text style={styles.cardTitle}>Business Information</Text>
        <DetailRow icon="business-outline" label="Business Name" value={displayName} />
        <DetailRow icon="document-text-outline" label="GST Number" value={vendor.gstNumber} />
        <DetailRow
          icon="information-circle-outline"
          label="Business Details"
          value={vendor.businessDetails}
        />

        <Text style={styles.cardTitle}>Contact Details</Text>
        {(vendor.openingBalance ?? 0) > 0 ? (
          <DetailRow
            icon="wallet-outline"
            label="Opening Balance"
            value={`${formatCurrency(vendor.openingBalance ?? 0)} · ${formatOpeningBalanceLabel(
              'vendor',
              vendor.openingBalanceNature ?? 'TO_PAY',
            )}`}
          />
        ) : null}
        <DetailRow icon="person-outline" label="Contact Person" value={vendor.contactPerson} />
        <DetailRow icon="call-outline" label="Phone" value={vendor.phone} />
        <DetailRow icon="mail-outline" label="Email" value={vendor.email} />
        <DetailRow icon="location-outline" label="Address" value={vendor.address} />

        <View style={styles.activeRow}>
          <View>
            <Text style={styles.activeLabel}>Status</Text>
            <Text style={styles.activeHint}>
              {vendor.active ? 'Active vendor' : 'Inactive vendor'}
            </Text>
          </View>
          <Switch
            value={vendor.active}
            onValueChange={handleToggleActive}
            disabled={togglingActive || !canEdit}
            trackColor={{ false: theme.colors.border, true: 'rgba(34, 197, 94, 0.35)' }}
            thumbColor={vendor.active ? theme.colors.success : theme.colors.textSecondary}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        {canEdit ? <Button title="Edit Vendor" onPress={onEdit} /> : null}
        {canDelete ? (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <Text style={styles.deleteText}>Delete Vendor</Text>
          </Pressable>
        ) : null}
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
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
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
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderDot: { width: 8, height: 8, borderRadius: 4 },
  orderMain: { flex: 1 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  orderNumber: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600', flex: 1 },
  orderAmount: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '700' },
  orderMeta: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12), flex: 1 },
  orderStatus: { fontSize: theme.scaleFont(12), fontWeight: '600' },
  emptyTitle: { color: theme.colors.text, fontWeight: '700', fontSize: theme.scaleFont(15) },
  emptyHint: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13), marginTop: 6 },
  footerLoader: { marginVertical: 16 },

  };
}
