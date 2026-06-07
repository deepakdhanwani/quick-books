import { Text, View } from 'react-native';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { AppTheme } from '../theme/types';
import type { ReportSummaryItem } from '../services/api';
import { formatCurrency, parseAmount } from '../utils/saleAmounts';

type ReportSummaryGridProps = {
  items: ReportSummaryItem[];
};

function formatSummaryValue(label: string, value: string) {
  const lower = label.toLowerCase();
  if (
    lower.includes('amount') ||
    lower.includes('sales') ||
    lower.includes('purchase') ||
    lower.includes('revenue') ||
    lower.includes('pending') ||
    lower.includes('position') ||
    lower.includes('payable') ||
    lower.includes('receivable')
  ) {
    const parsed = parseAmount(value);
    if (Number.isFinite(parsed)) {
      return formatCurrency(parsed);
    }
  }
  return value;
}

export function ReportSummaryGrid({ items }: ReportSummaryGridProps) {
  const styles = useThemedStyles(createStyles);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.tile}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{formatSummaryValue(item.label, item.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
      marginBottom: 16,
    },
    tile: {
      flexGrow: 1,
      flexBasis: 140,
      minWidth: 130,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
      marginBottom: 6,
    },
    value: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(18),
      fontWeight: '700' as const,
    },
  };
}
