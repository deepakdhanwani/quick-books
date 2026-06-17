import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { SnoozeReminderModal } from '../components/SnoozeReminderModal';
import { api, PaymentReminder, PaymentReminderTimeFilter } from '../services/api';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { appAlert } from '../utils/appAlert';
import { LIST_PERFORMANCE_PROPS, useInfiniteScrollHandlers } from '../utils/infiniteScroll';
import { formatCurrency, formatDate } from '../utils/saleAmounts';

const PAGE_SIZE = 20;

type ReminderFilter = PaymentReminderTimeFilter;

const FILTER_OPTIONS: { value: ReminderFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

type PaymentRemindersScreenProps = {
  token: string;
  onAddReminder: () => void;
  onEditReminder: (id: number) => void;
};

function getStatusLabel(reminder: PaymentReminder) {
  if (reminder.status === 'COMPLETED') {
    return 'Completed';
  }
  if (reminder.status === 'CANCELLED') {
    return 'Cancelled';
  }
  if (reminder.overdue) {
    return `Overdue · ${formatDate(reminder.effectiveDueDate)}`;
  }
  if (reminder.status === 'SNOOZED') {
    return `Snoozed · ${formatDate(reminder.effectiveDueDate)}`;
  }
  return `Due ${formatDate(reminder.effectiveDueDate)}`;
}

export function PaymentRemindersScreen({
  token,
  onAddReminder,
  onEditReminder,
}: PaymentRemindersScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState<ReminderFilter>('active');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const [snoozeTarget, setSnoozeTarget] = useState<PaymentReminder | null>(null);
  const [snoozing, setSnoozing] = useState(false);

  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNumber: number, reset: boolean) => {
      const response = await api.listPaymentReminders(token, pageNumber, PAGE_SIZE, timeFilter);
      setReminders((current) => (reset ? response.content : [...current, ...response.content]));
      setPage(pageNumber);
      setHasMore(pageNumber + 1 < response.totalPages);
      setTotalElements(response.totalElements);
      return response;
    },
    [timeFilter, token],
  );

  const loadReminders = useCallback(
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
          setError(err instanceof Error ? err.message : 'Could not load more reminders');
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
        setError(err instanceof Error ? err.message : 'Could not load reminders');
        setReminders([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, hasMore, page],
  );

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReminders({ pullRefresh: true });
    setRefreshing(false);
  };

  const { onEndReached, onMomentumScrollBegin } = useInfiniteScrollHandlers(() => {
    void loadReminders({ loadMore: true });
  });

  const handleDelete = (reminder: PaymentReminder) => {
    appAlert('Delete reminder', `Delete reminder for ${reminder.customerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePaymentReminder(token, reminder.id);
            await loadReminders({ pullRefresh: true });
          } catch (err) {
            appAlert('Delete failed', err instanceof Error ? err.message : 'Could not delete reminder');
          }
        },
      },
    ]);
  };

  const handleComplete = (reminder: PaymentReminder) => {
    appAlert('Mark complete', `Mark reminder for ${reminder.customerName} as done?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            await api.completePaymentReminder(token, reminder.id);
            await loadReminders({ pullRefresh: true });
          } catch (err) {
            appAlert('Update failed', err instanceof Error ? err.message : 'Could not complete reminder');
          }
        },
      },
    ]);
  };

  const handleSnoozeConfirm = async (snoozedUntil: string) => {
    if (!snoozeTarget) {
      return;
    }

    setSnoozing(true);
    try {
      await api.snoozePaymentReminder(token, snoozeTarget.id, { snoozedUntil });
      setSnoozeTarget(null);
      await loadReminders({ pullRefresh: true });
    } catch (err) {
      appAlert('Snooze failed', err instanceof Error ? err.message : 'Could not snooze reminder');
    } finally {
      setSnoozing(false);
    }
  };

  const renderItem = ({ item }: { item: PaymentReminder }) => {
    const isClosed = item.status === 'COMPLETED' || item.status === 'CANCELLED';
    const statusColor = item.overdue
      ? theme.colors.error
      : item.dueToday
        ? theme.colors.warning
        : theme.colors.textSecondary;

    return (
      <Card style={styles.card}>
        <Pressable onPress={() => !isClosed && onEditReminder(item.id)}>
          <View style={styles.cardHeader}>
            <View style={styles.cardMain}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={[styles.status, { color: statusColor }]}>{getStatusLabel(item)}</Text>
              {item.amount != null ? (
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              ) : null}
              {item.invoiceNumber ? (
                <Text style={styles.invoice}>Invoice {item.invoiceNumber}</Text>
              ) : null}
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
            {!isClosed ? (
              <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
            ) : null}
          </View>
        </Pressable>

        {!isClosed ? (
          <View style={styles.actions}>
            <Pressable style={styles.actionChip} onPress={() => setSnoozeTarget(item)}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.actionChipText}>Snooze</Text>
            </Pressable>
            <Pressable style={styles.actionChip} onPress={() => handleComplete(item)}>
              <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
              <Text style={styles.actionChipText}>Done</Text>
            </Pressable>
            <Pressable style={styles.actionChip} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              <Text style={[styles.actionChipText, { color: theme.colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((option) => {
            const selected = timeFilter === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setTimeFilter(option.value)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.addButton} onPress={onAddReminder}>
          <Ionicons name="add" size={22} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>New reminder</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && reminders.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={onEndReached}
          onMomentumScrollBegin={onMomentumScrollBegin}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="alarm-outline" size={42} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {timeFilter === 'past' ? 'No past reminders' : 'No reminders yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {timeFilter === 'past'
                  ? 'Completed reminders will appear here.'
                  : 'Create a reminder when a customer promises to pay on a specific date.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.footerLoader} />
            ) : null
          }
          ListHeaderComponent={
            totalElements > 0 ? (
              <Text style={styles.countLabel}>
                {totalElements} reminder{totalElements === 1 ? '' : 's'}
              </Text>
            ) : null
          }
          {...LIST_PERFORMANCE_PROPS}
        />
      )}

      <SnoozeReminderModal
        visible={snoozeTarget != null}
        customerName={snoozeTarget?.customerName}
        onClose={() => setSnoozeTarget(null)}
        onConfirm={handleSnoozeConfirm}
        saving={snoozing}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
    },
    toolbar: {
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 12,
    },
    filterRow: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    filterChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      alignItems: 'center' as const,
    },
    filterChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    filterChipText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      fontWeight: '600' as const,
    },
    filterChipTextActive: {
      color: theme.colors.primary,
    },
    addButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
    },
    addButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(13),
      textAlign: 'center' as const,
      paddingHorizontal: 20,
      marginTop: 8,
    },
    loadingBox: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    listContent: {
      padding: 20,
      paddingTop: 12,
      paddingBottom: 36,
      gap: 12,
    },
    countLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
      marginBottom: 4,
    },
    card: {
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 10,
    },
    cardMain: {
      flex: 1,
      gap: 3,
    },
    customerName: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
    },
    status: {
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    amount: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
      marginTop: 2,
    },
    invoice: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
    },
    notes: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    actionChip: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    actionChipText: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    emptyBox: {
      alignItems: 'center' as const,
      paddingVertical: 48,
      gap: 10,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
    },
    emptyBody: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(18),
      textAlign: 'center' as const,
      paddingHorizontal: 24,
    },
    footerLoader: {
      marginTop: 16,
    },
  };
}
