import { Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency } from '../../utils/saleAmounts';

type CashPositionCardProps = {
  receivables: number;
  payables: number;
  netOutlook?: number;
  outlookSummary?: string;
};

export function CashPositionCard({
  receivables,
  payables,
  netOutlook,
  outlookSummary,
}: CashPositionCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const total = receivables + payables;
  const receivableShare = total > 0 ? receivables / total : 0.5;
  const netPositive = (netOutlook ?? receivables - payables) >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Cash Position</Text>
      <Text style={styles.subtitle}>What customers owe you vs what you owe vendors</Text>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>To Collect</Text>
          <Text style={[styles.amountValue, { color: theme.colors.success }]}>
            {formatCurrency(receivables)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>To Pay</Text>
          <Text style={[styles.amountValue, { color: theme.colors.error }]}>
            {formatCurrency(payables)}
          </Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barIn,
            { width: `${Math.max(Math.round(receivableShare * 100), 4)}%`, backgroundColor: theme.colors.success },
          ]}
        />
        <View
          style={[
            styles.barOut,
            {
              width: `${Math.max(Math.round((1 - receivableShare) * 100), 4)}%`,
              backgroundColor: theme.colors.error,
            },
          ]}
        />
      </View>

      <View style={styles.netRow}>
        <Text style={styles.netLabel}>Net cash exposure</Text>
        <Text style={[styles.netValue, { color: netPositive ? theme.colors.success : theme.colors.error }]}>
          {formatCurrency(netOutlook ?? receivables - payables)}
        </Text>
      </View>

      {outlookSummary ? <Text style={styles.summary}>{outlookSummary}</Text> : null}
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
    amountRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    amountBlock: {
      flex: 1,
      alignItems: 'center' as const,
    },
    amountLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      marginBottom: 4,
    },
    amountValue: {
      fontSize: theme.scaleFont(17),
      fontWeight: '800' as const,
    },
    divider: {
      width: 1,
      height: 36,
      backgroundColor: theme.colors.border,
    },
    barTrack: {
      flexDirection: 'row' as const,
      height: 10,
      borderRadius: 999,
      overflow: 'hidden' as const,
      backgroundColor: theme.colors.background,
      marginBottom: 12,
    },
    barIn: {
      height: '100%' as const,
    },
    barOut: {
      height: '100%' as const,
    },
    netRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      marginBottom: 10,
    },
    netLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '600' as const,
    },
    netValue: {
      fontSize: theme.scaleFont(16),
      fontWeight: '800' as const,
    },
    summary: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
    },
  };
}
