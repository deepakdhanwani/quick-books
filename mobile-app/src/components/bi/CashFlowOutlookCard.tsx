import { Text, View } from 'react-native';
import type { CashFlowOutlook } from '../../services/api';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency } from '../../utils/saleAmounts';

type CashFlowOutlookCardProps = {
  outlook: CashFlowOutlook;
};

export function CashFlowOutlookCard({ outlook }: CashFlowOutlookCardProps) {
  const styles = useThemedStyles(createStyles);
  const positive = outlook.netOutlook >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Cash Flow Outlook</Text>
      <Text style={styles.subtitle}>Expected movement if collections and payouts follow recent patterns</Text>

      <View style={styles.row}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Expected In</Text>
          <Text style={[styles.metricValue, styles.inflow]}>{formatCurrency(outlook.expectedInflow)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Expected Out</Text>
          <Text style={[styles.metricValue, styles.outflow]}>{formatCurrency(outlook.expectedOutflow)}</Text>
        </View>
      </View>

      <View style={styles.netBox}>
        <Text style={styles.netLabel}>Net Outlook</Text>
        <Text style={[styles.netValue, positive ? styles.positive : styles.negative]}>
          {formatCurrency(outlook.netOutlook)}
        </Text>
      </View>

      <Text style={styles.summary}>{outlook.summary}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    card: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      marginBottom: 18,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginBottom: 14,
    },
    row: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 12,
    },
    metricBox: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      marginBottom: 6,
      textTransform: 'uppercase' as const,
    },
    metricValue: {
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
    },
    inflow: {
      color: theme.colors.success,
    },
    outflow: {
      color: theme.colors.error,
    },
    netBox: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.primaryMuted,
      marginBottom: 12,
    },
    netLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
    },
    netValue: {
      fontSize: theme.scaleFont(18),
      fontWeight: '800' as const,
    },
    positive: {
      color: theme.colors.success,
    },
    negative: {
      color: theme.colors.error,
    },
    summary: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
    },
  };
}
