import { Ionicons } from '@expo/vector-icons';
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
import { api, PaymentListFilter, Purchase, Vendor } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { colors } from '../theme/colors';
import {
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';
import { getVendorDisplayName } from '../utils/vendorType';

const PAGE_SIZE = 20;

type VendorDetailTab = 'details' | 'purchases';

type VendorDetailScreenProps = {
  token: string;
  vendorId: number;
  onEdit: () => void;
  onDeleted: () => void;
  onOpenPurchase: (purchaseId: number) => void;
};

function getSubtitle(vendor: Vendor) {
  return vendor.contactPerson ?? vendor.phone ?? vendor.email ?? 'No contact info';
}

export function VendorDetailScreen({
  token,
  vendorId,
  onEdit,
  onDeleted,
  onOpenPurchase,
}: VendorDetailScreenProps) {
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

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  useEffect(() => {
    if (activeTab === 'purchases') {
      loadPurchases();
    }
  }, [activeTab, paymentFilter, vendorId, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'details') {
      await loadVendor(true);
    } else {
      setPurchasesRefreshing(true);
      await loadPurchases({ pullRefresh: true });
      setPurchasesRefreshing(false);
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
        <ActivityIndicator color={colors.primary} size="large" />
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

  const avatarColor = vendor.active ? colors.success : colors.textSecondary;
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
      <Pressable style={styles.orderRow} onPress={() => onOpenPurchase(item.id)}>
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
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
      </Pressable>
    );
  };

  if (activeTab === 'purchases') {
    return (
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
                tabs={[
                  { id: 'details', label: 'Details' },
                  { id: 'purchases', label: 'Purchases' },
                ]}
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
                <ActivityIndicator color={colors.primary} />
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
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      </View>
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
        tabs={[
          { id: 'details', label: 'Details' },
          { id: 'purchases', label: 'Purchases' },
        ]}
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
            disabled={togglingActive}
            trackColor={{ false: colors.border, true: 'rgba(34, 197, 94, 0.35)' }}
            thumbColor={vendor.active ? colors.success : colors.textSecondary}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button title="Edit Vendor" onPress={onEdit} />
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete Vendor</Text>
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
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  avatarText: { fontSize: 28, fontWeight: '700' },
  statusDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  nameInactive: { color: colors.textSecondary },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
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
    borderBottomColor: colors.border,
  },
  detailText: { flex: 1 },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: { color: colors.text, fontSize: 15 },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    gap: 16,
  },
  activeLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  activeHint: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
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
  deleteText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  error: { color: colors.error, marginTop: 12, textAlign: 'center' },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  orderNumber: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  orderAmount: { color: colors.text, fontSize: 15, fontWeight: '700' },
  orderMeta: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  orderStatus: { fontSize: 12, fontWeight: '600' },
  emptyTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  emptyHint: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
  footerLoader: { marginVertical: 16 },
});
