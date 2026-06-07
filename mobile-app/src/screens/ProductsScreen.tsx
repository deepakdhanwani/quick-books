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
import { api, Product } from '../services/api';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/saleAmounts';

const PAGE_SIZE = 20;

type ProductsScreenProps = {
  token: string;
  onAddProduct: () => void;
  onOpenProduct: (id: number) => void;
};

type StatusFilter = 'all' | 'active' | 'inactive';

function getAvatarColor(active: boolean) {
  return active ? colors.success : colors.textSecondary;
}

export function ProductsScreen({ token, onAddProduct, onOpenProduct }: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getActiveParam = useCallback(() => {
    if (statusFilter === 'all') return undefined;
    return statusFilter === 'active';
  }, [statusFilter]);

  const fetchPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.listProducts(
        token,
        pageNumber,
        PAGE_SIZE,
        getActiveParam(),
        debouncedSearch,
      );
      setProducts((current) => (reset ? response.content : [...current, ...response.content]));
      setPage(pageNumber);
      setHasMore(pageNumber + 1 < response.totalPages);
    },
    [debouncedSearch, getActiveParam, token],
  );

  const loadProducts = useCallback(
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
          setError(err instanceof Error ? err.message : 'Could not load more products');
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
        setProducts([]);
        setHasMore(false);
        setError(err instanceof Error ? err.message : 'Could not load products');
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, hasMore, page],
  );

  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, statusFilter, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts({ pullRefresh: true });
    setRefreshing(false);
  };

  const renderFilterChip = (label: string, value: StatusFilter) => {
    const selected = statusFilter === value;
    return (
      <Pressable
        key={value}
        style={[styles.filterChip, selected && styles.filterChipActive]}
        onPress={() => setStatusFilter(value)}
      >
        <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const accentColor = getAvatarColor(item.active);
    return (
      <Pressable style={styles.row} onPress={() => onOpenProduct(item.id)}>
        <View style={[styles.avatar, { backgroundColor: `${accentColor}20` }]}>
          <Text style={[styles.avatarText, { color: accentColor }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, !item.active && styles.nameInactive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Net {formatCurrency(item.netAmount)}
            {item.discount > 0 ? ` · Disc ${formatCurrency(item.discount)}` : ''}
          </Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: accentColor }]} />
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </Pressable>
    );
  };

  if (loading && products.length === 0) {
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
              placeholder="Search products"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <Pressable style={styles.addButton} onPress={onAddProduct}>
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.filters}>
        {renderFilterChip('All', 'all')}
        {renderFilterChip('Active', 'active')}
        {renderFilterChip('Inactive', 'inactive')}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={() => loadProducts({ loadMore: true })}
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
            <Ionicons name="cube-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Tap + to add a product.</Text>
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
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: colors.primary,
  },
  filterChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: colors.primary },
  error: { color: colors.error, paddingHorizontal: 20, marginBottom: 8 },
  list: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: { paddingBottom: 8, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  nameInactive: { color: colors.textSecondary },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    marginTop: 12,
    marginHorizontal: 20,
    gap: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
