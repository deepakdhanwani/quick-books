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
import { StatusFilter, StatusFilterChips } from '../components/StatusFilterChips';
import { api, Customer } from '../services/api';
import { LIST_PERFORMANCE_PROPS, useInfiniteScrollHandlers } from '../utils/infiniteScroll';
import { isBusinessCustomerType } from '../utils/customerType';
import { formatCurrency } from '../utils/saleAmounts';

const PAGE_SIZE = 20;

type CustomersScreenProps = {
  token: string;
  onAddCustomer: () => void;
  onOpenCustomer: (id: number) => void;
  canCreate?: boolean;
};

function getContactSubtitle(customer: Customer) {
  if (isBusinessCustomerType(customer.customerType) && customer.businessName) {
    return customer.businessName;
  }
  return customer.phone ?? customer.email ?? 'No phone or email';
}

function getAvatarColor(active: boolean, colors: AppTheme['colors']) {
  return active ? colors.success : colors.textSecondary;
}

export function CustomersScreen({ token, onAddCustomer, onOpenCustomer, canCreate = true }: CustomersScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getActiveParam = useCallback(() => {
    if (statusFilter === 'all') {
      return undefined;
    }
    return statusFilter === 'active';
  }, [statusFilter]);

  const fetchPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.listCustomers(
        token,
        pageNumber,
        PAGE_SIZE,
        getActiveParam(),
        debouncedSearch,
      );

      setCustomers((current) => (reset ? response.content : [...current, ...response.content]));
      setPage(pageNumber);
      setHasMore(pageNumber + 1 < response.totalPages);
      setTotalElements(response.totalElements);
      return response;
    },
    [debouncedSearch, getActiveParam, token],
  );

  const loadCustomers = useCallback(
    async (options?: { pullRefresh?: boolean; loadMore?: boolean }) => {
      const pullRefresh = options?.pullRefresh ?? false;
      const loadMore = options?.loadMore ?? false;

      if (loadMore) {
        if (!hasMore || loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError('');
        try {
          await fetchPage(page + 1, false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not load more customers');
        } finally {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
        return;
      }

      if (!pullRefresh) {
        setLoading(true);
      }
      setError('');
      try {
        await fetchPage(0, true);
      } catch (err) {
        setCustomers([]);
        setHasMore(false);
        setError(err instanceof Error ? err.message : 'Could not load customers');
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, hasMore, page],
  );

  const infiniteScroll = useInfiniteScrollHandlers(() => loadCustomers({ loadMore: true }));

  useEffect(() => {
    loadCustomers();
  }, [debouncedSearch, statusFilter, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomers({ pullRefresh: true });
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

  const renderCustomer = ({ item }: { item: Customer }) => {
    const accentColor = getAvatarColor(item.active, theme.colors);
    const hasPending = (item.totalPendingAmount ?? 0) > 0;

    return (
      <Pressable style={styles.contactRow} onPress={() => onOpenCustomer(item.id)}>
        <View style={[styles.avatar, { backgroundColor: `${accentColor}20` }]}>
          <Text style={[styles.avatarText, { color: accentColor }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, !item.active && styles.contactNameInactive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.contactSubtitle} numberOfLines={1}>
            {getContactSubtitle(item)}
          </Text>
        </View>
        {hasPending ? (
          <Text style={styles.pendingAmount}>{formatCurrency(item.totalPendingAmount!)}</Text>
        ) : null}
        <View style={[styles.statusIndicator, { backgroundColor: accentColor }]} />
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </Pressable>
    );
  };

  if (loading && customers.length === 0) {
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
              placeholder="Search customers"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          {canCreate ? (
            <Pressable
              style={styles.addButton}
              onPress={onAddCustomer}
              accessibilityLabel="Add customer"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
            </Pressable>
          ) : null}
        </View>
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={customers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCustomer}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        {...LIST_PERFORMANCE_PROPS}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={infiniteScroll.onEndReached}
        onEndReachedThreshold={0.35}
        onMomentumScrollBegin={infiniteScroll.onMomentumScrollBegin}
        ListFooterComponent={
          loadingMore || (customers.length > 0 && totalElements > customers.length) ? (
            <View style={styles.footerLoader}>
              {loadingMore ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
              {!loadingMore && totalElements > customers.length ? (
                <Text style={styles.footerMeta}>
                  Showing {customers.length} of {totalElements}
                </Text>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={36} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptyText}>Tap + to add a customer.</Text>
          </Card>
        }
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.scaleFont(16),
    paddingVertical: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: theme.colors.error,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  contactRow: {
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
  avatarText: {
    fontSize: theme.scaleFont(16),
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactName: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(16),
    fontWeight: '600',
  },
  contactNameInactive: {
    color: theme.colors.textSecondary,
  },
  contactSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    marginTop: 2,
  },
  pendingAmount: {
    color: theme.colors.warning,
    fontSize: theme.scaleFont(12),
    fontWeight: '700',
    marginRight: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 66,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  footerMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    marginTop: 12,
    marginHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(18),
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.scaleFont(20),
  },

  };
}
