import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import type { PaymentReminder } from '../../services/api';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency, formatDate } from '../../utils/saleAmounts';

type DashboardRemindersCardProps = {
  reminders: PaymentReminder[];
  onViewAll?: () => void;
  onSnooze?: (reminder: PaymentReminder) => void;
  onComplete?: (reminder: PaymentReminder) => void;
};

export function DashboardRemindersCard({
  reminders,
  onViewAll,
  onSnooze,
  onComplete,
}: DashboardRemindersCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const pulse = useRef(new Animated.Value(0)).current;

  if (reminders.length === 0) {
    return null;
  }

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      pulse.stopAnimation();
    };
  }, [pulse]);

  const overdueCount = reminders.filter((item) => item.overdue).length;
  const todayCount = reminders.filter((item) => item.dueToday).length;
  const topReminders = [...reminders]
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .slice(0, 5);

  const subtitle =
    overdueCount > 0 && todayCount > 0
      ? `${todayCount} due today, ${overdueCount} overdue`
      : overdueCount > 0
        ? `${overdueCount} overdue follow-up${overdueCount === 1 ? '' : 's'}`
        : `${todayCount} payment follow-up${todayCount === 1 ? '' : 's'} due today`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Animated.View
              style={[
                styles.iconPulse,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                  transform: [
                    {
                      scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="alarm-outline" size={16} color={theme.colors.warning} />
            </Animated.View>
            <Text style={styles.title}>Payment reminders</Text>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        ) : null}
      </View>

      {topReminders.map((reminder) => {
        const statusColor = reminder.overdue ? theme.colors.error : theme.colors.warning;
        const statusLabel = reminder.overdue
          ? `Overdue · ${formatDate(reminder.effectiveDueDate)}`
          : reminder.status === 'SNOOZED'
            ? `Snoozed · ${formatDate(reminder.effectiveDueDate)}`
            : `Due today`;

        return (
          <View key={reminder.id} style={styles.item}>
            <View style={styles.itemMain}>
              <Text style={styles.customerName}>{reminder.customerName}</Text>
              <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
              {reminder.amount != null ? (
                <Text style={styles.amount}>{formatCurrency(reminder.amount)}</Text>
              ) : null}
              {reminder.invoiceNumber ? (
                <Text style={styles.invoice}>Invoice {reminder.invoiceNumber}</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              {onSnooze ? (
                <Pressable style={styles.actionButton} onPress={() => onSnooze(reminder)}>
                  <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                </Pressable>
              ) : null}
              {onComplete ? (
                <Pressable style={styles.actionButton} onPress={() => onComplete(reminder)}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.success} />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    card: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${theme.colors.warning}55`,
      backgroundColor: `${theme.colors.warning}12`,
      marginBottom: 18,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 12,
      gap: 12,
    },
    headerText: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      marginBottom: 4,
    },
    iconPulse: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: `${theme.colors.warning}22`,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
    },
    viewAll: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(13),
      fontWeight: '700' as const,
    },
    item: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: `${theme.colors.border}88`,
    },
    itemMain: {
      flex: 1,
      gap: 2,
    },
    customerName: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
    status: {
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    amount: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '600' as const,
      marginTop: 2,
    },
    invoice: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 6,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  };
}
