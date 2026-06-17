import { Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { PartyAccountSummary as PartyAccountSummaryType } from '../services/api';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { formatCurrency } from '../utils/saleAmounts';

type PartyAccountSummaryProps = {
  mode: 'customer' | 'vendor';
  summary: PartyAccountSummaryType | null;
  loading?: boolean;
};

export function PartyAccountSummary({ mode, summary, loading }: PartyAccountSummaryProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const balanceLabel = mode === 'customer' ? 'Receivable' : 'Payable';
  const closing = summary?.closingBalance ?? 0;
  const hasAdjusted = (summary?.totalAdjusted ?? 0) > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Metric label="Total Debit" value={formatCurrency(summary?.totalDebit ?? 0)} loading={loading} />
        <Metric label="Total Credit" value={formatCurrency(summary?.totalCredit ?? 0)} loading={loading} />
        <Metric
          label={`Closing ${balanceLabel}`}
          value={formatCurrency(closing)}
          loading={loading}
          highlight={
            closing > 0
              ? mode === 'customer'
                ? theme.colors.warning
                : theme.colors.error
              : theme.colors.success
          }
        />
      </View>

      {hasAdjusted && !loading ? (
        <Text style={styles.adjustedNote}>
          Includes {formatCurrency(summary?.totalAdjusted ?? 0)} in settlement adjustments
        </Text>
      ) : null}

      {!loading && summary ? (
        <Text style={styles.meta}>{summary.entryCount} ledger entries</Text>
      ) : null}
    </View>
  );
}

function Metric({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: string;
  loading?: boolean;
  highlight?: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, highlight ? { color: highlight } : null]}>
        {loading ? '—' : value}
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      width: '100%' as const,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 8,
    },
    row: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    metric: {
      flex: 1,
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      marginBottom: 4,
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '800' as const,
    },
    adjustedNote: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      lineHeight: theme.scaleFont(16),
      textAlign: 'center' as const,
    },
    meta: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      textAlign: 'center' as const,
    },
  };
}
