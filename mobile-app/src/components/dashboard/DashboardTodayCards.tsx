import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type DashboardTodayCardsProps = {
  todaySales: string;
  todayPurchases: string;
  outstanding: string;
};

export function DashboardTodayCards({ todaySales, todayPurchases, outstanding }: DashboardTodayCardsProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.row}>
        <View style={[styles.card, styles.salesCard]}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.success}22` }]}>
            <Ionicons name="trending-up" size={20} color={theme.colors.success} />
          </View>
          <Text style={styles.value}>{todaySales}</Text>
          <Text style={styles.label}>Sales</Text>
        </View>

        <View style={[styles.card, styles.purchaseCard]}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}22` }]}>
            <Ionicons name="bag-handle-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.value}>{todayPurchases}</Text>
          <Text style={styles.label}>Purchases</Text>
        </View>
      </View>

      <View style={styles.outstandingCard}>
        <View style={styles.outstandingLeft}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.warning}22` }]}>
            <Ionicons name="time-outline" size={18} color={theme.colors.warning} />
          </View>
          <View>
            <Text style={styles.outstandingLabel}>Total Outstanding</Text>
            <Text style={styles.outstandingHint}>Receivables + payables due</Text>
          </View>
        </View>
        <Text style={[styles.outstandingValue, { color: theme.colors.warning }]}>{outstanding}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginBottom: 18,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 10,
    },
    card: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    salesCard: {
      borderColor: `${theme.colors.success}33`,
    },
    purchaseCard: {
      borderColor: `${theme.colors.primary}33`,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 12,
    },
    value: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(22),
      fontWeight: '800' as const,
      marginBottom: 4,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    outstandingCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.colors.warning}33`,
      backgroundColor: `${theme.colors.warning}0D`,
      gap: 10,
    },
    outstandingLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      flex: 1,
    },
    outstandingLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '700' as const,
    },
    outstandingHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      marginTop: 2,
    },
    outstandingValue: {
      fontSize: theme.scaleFont(17),
      fontWeight: '800' as const,
    },
  };
}
