import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
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
import { TransactionDateFilter, TransactionDateFilterSummary } from '../components/TransactionDateFilter';
import { api, PaymentListFilter, Sale } from '../services/api';
import {
  AppliedDateFilter,
  getClearedDateFilter,
  getDefaultDateFilter,
  resolveDateFilterParams,
} from '../utils/dateListFilter';
import { LIST_PERFORMANCE_PROPS, useInfiniteScrollHandlers } from '../utils/infiniteScroll';
import {
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';

const PAGE_SIZE = 20;

type SalesScreenProps = {
  token: string;
  onAddSale: () => void;
  onOpenSale: (id: number) => void;
  canCreate?: boolean;
};

export function SalesScreen({ token, onAddSale, onOpenSale, canCreate = true }: SalesScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentListFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<AppliedDateFilter>(getDefaultDateFilter);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const { fromDate, toDate } = resolveDateFilterParams(dateFilter);
      const response = await api.listSales(
        token,
        pageNumber,
        PAGE_SIZE,
        debouncedSearch,
        paymentFilter,
        fromDate,
        toDate,
      );
      setSales((current) => (reset ? response.content : [...current, ...response.content]));
      setPage(pageNumber);
      setHasMore(pageNumber + 1 < response.totalPages);
      setTotalElements(response.totalElements);
    },
    [dateFilter, debouncedSearch, paymentFilter, token],
  );

  const loadSales = useCallback(
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
          setError(err instanceof Error ? err.message : 'Could not load more sales');
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
        setSales([]);
        setHasMore(false);
        setError(err instanceof Error ? err.message : 'Could not load sales');
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, hasMore, page],
  );

  const infiniteScroll = useInfiniteScrollHandlers(() => loadSales({ loadMore: true }));

  useEffect(() => {
    loadSales();
  }, [dateFilter, debouncedSearch, paymentFilter, token]);

  const renderSale = ({ item }: { item: Sale }) => {
    const statusColor = getPaymentStatusColor(item.paymentStatus);
    const statusLabel = getPaymentStatusLabel(item.paymentStatus);
    const hasPending = item.pendingAmount > 0 && item.paymentStatus !== 'PAID';
    const invoiceRef = item.invoiceNumber ?? `#${item.id}`;
    const subtitleParts = [invoiceRef, formatDate(item.date)];
    if (hasPending) {
      subtitleParts.push(`Due ${formatCurrency(item.pendingAmount)}`);
    }

    return (
      <Pressable style={styles.row} onPress={() => onOpenSale(item.id)}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName}
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
        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
      </Pressable>
    );
  };

  if (loading && sales.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search invoice or customer"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <TransactionDateFilter
            value={dateFilter}
            onApply={setDateFilter}
            onClear={() => setDateFilter(getClearedDateFilter())}
          />
          {canCreate ? (
            <Pressable style={styles.addButton} onPress={onAddSale}>
              <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
            </Pressable>
          ) : null}
        </View>
        <PaymentListFilterChips value={paymentFilter} onChange={setPaymentFilter} />
        <TransactionDateFilterSummary value={dateFilter} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSale}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        {...LIST_PERFORMANCE_PROPS}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadSales({ pullRefresh: true });
              setRefreshing(false);
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={infiniteScroll.onEndReached}
        onEndReachedThreshold={0.35}
        onMomentumScrollBegin={infiniteScroll.onMomentumScrollBegin}
        ListFooterComponent={
          loadingMore || (sales.length > 0 && totalElements > sales.length) ? (
            <View style={styles.footerLoader}>
              {loadingMore ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
              {!loadingMore && totalElements > sales.length ? (
                <Text style={styles.footerMeta}>
                  Showing {sales.length} of {totalElements}
                </Text>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={36} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>No sales found</Text>
            <Text style={styles.emptyText}>Tap + to record a new sale.</Text>
          </Card>
        }
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: { paddingHorizontal: 20, paddingTop: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: theme.scaleFont(16), paddingVertical: 12 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: theme.colors.error, paddingHorizontal: 20, marginBottom: 8 },
  list: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  customerName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    fontWeight: '600',
  },
  amount: {
    color: theme.colors.primary,
    fontSize: theme.scaleFont(13),
    fontWeight: '700',
  },
  subtitle: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(11),
  },
  statusLabel: {
    fontSize: theme.scaleFont(10),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  separator: { height: 1, backgroundColor: theme.colors.border, marginLeft: 30 },
  footerLoader: { paddingVertical: 16, alignItems: 'center', gap: 8 },
  footerMeta: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12) },
  emptyCard: { alignItems: 'center', paddingVertical: 36, margin: 20, gap: 8 },
  emptyTitle: { color: theme.colors.text, fontSize: theme.scaleFont(18), fontWeight: '700' },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center' },

  };
}
