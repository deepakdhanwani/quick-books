import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { PaymentListFilterChips } from '../components/PaymentListFilterChips';
import { api, PaymentListFilter, Purchase } from '../services/api';
import { colors } from '../theme/colors';
import {
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';

const PAGE_SIZE = 20;

type PurchasesScreenProps = {
  token: string;
  onAddPurchase: () => void;
  onOpenPurchase: (id: number) => void;
};

export function PurchasesScreen({ token, onAddPurchase, onOpenPurchase }: PurchasesScreenProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentListFilter>('ALL');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.listPurchases(token, pageNumber, PAGE_SIZE, debouncedSearch, paymentFilter);
      setPurchases((current) => (reset ? response.content : [...current, ...response.content]));
      setPage(pageNumber);
      setHasMore(pageNumber + 1 < response.totalPages);
    },
    [debouncedSearch, paymentFilter, token],
  );

  const loadPurchases = useCallback(
    async (options?: { pullRefresh?: boolean; loadMore?: boolean }) => {
      const pullRefresh = options?.pullRefresh ?? false;
      const loadMore = options?.loadMore ?? false;

      if (loadMore) {
        if (!hasMore || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError('');
        try {
          await fetchPage(page + 1, false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not load more purchases');
        } finally {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
        return;
      }

      if (!pullRefresh) setLoading(true);
      setError('');
      try {
        await fetchPage(0, true);
      } catch (err) {
        setPurchases([]);
        setHasMore(false);
        setError(err instanceof Error ? err.message : 'Could not load purchases');
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, hasMore, page],
  );

  useEffect(() => {
    loadPurchases();
  }, [debouncedSearch, paymentFilter, token]);

  const renderPurchase = ({ item }: { item: Purchase }) => {
    const statusColor = getPaymentStatusColor(item.paymentStatus);
    const statusLabel = getPaymentStatusLabel(item.paymentStatus);
    const hasPending = item.pendingAmount > 0 && item.paymentStatus !== 'PAID';
    const billRef = item.billNumber ?? `#${item.id}`;
    const subtitleParts = [billRef, formatDate(item.date)];
    if (hasPending) {
      subtitleParts.push(`Due ${formatCurrency(item.pendingAmount)}`);
    }

    return (
      <Pressable style={styles.row} onPress={() => onOpenPurchase(item.id)}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {item.vendorName}
            </Text>
            <Text style={styles.amount}>{formatCurrency(item.netAmount)}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitleParts.join(' · ')}
            </Text>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
      </Pressable>
    );
  };

  if (loading && purchases.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search bill or vendor"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <Pressable style={styles.addButton} onPress={onAddPurchase}>
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>
        <PaymentListFilterChips value={paymentFilter} onChange={setPaymentFilter} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={purchases}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPurchase}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={12}
        windowSize={7}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadPurchases({ pullRefresh: true });
              setRefreshing(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={() => loadPurchases({ loadMore: true })}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="bag-handle-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyTitle}>No purchases found</Text>
            <Text style={styles.emptyText}>Tap + to record a new purchase.</Text>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: { paddingHorizontal: 20, paddingTop: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: colors.error, paddingHorizontal: 20, marginBottom: 8 },
  list: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: { paddingBottom: 8, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    minHeight: 48,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  vendorName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 30 },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  emptyCard: { alignItems: 'center', paddingVertical: 36, margin: 20, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});
