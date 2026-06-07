import { Text, View } from 'react-native';
import type { ForecastMetric } from '../../services/api';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency } from '../../utils/saleAmounts';

type MonthPerformanceCardProps = {
  monthSales: number;
  monthPurchases: number;
  monthNetPosition: number;
  salesForecast?: ForecastMetric | null;
};

export function MonthPerformanceCard({
  monthSales,
  monthPurchases,
  monthNetPosition,
  salesForecast,
}: MonthPerformanceCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const total = monthSales + monthPurchases;
  const salesShare = total > 0 ? monthSales / total : 0.5;
  const netPositive = monthNetPosition >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>This Month</Text>
        {salesForecast ? (
          <View style={styles.forecastPill}>
            <Text style={styles.forecastPillText}>
              Forecast {formatCurrency(salesForecast.projectedValue)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metricsRow}>
        <MetricBlock label="Sales" value={formatCurrency(monthSales)} color={theme.colors.success} />
        <MetricBlock label="Purchases" value={formatCurrency(monthPurchases)} color={theme.colors.primary} />
        <MetricBlock
          label="Net"
          value={formatCurrency(monthNetPosition)}
          color={netPositive ? theme.colors.success : theme.colors.error}
        />
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barSales,
            { width: `${Math.round(salesShare * 100)}%`, backgroundColor: theme.colors.success },
          ]}
        />
        <View
          style={[
            styles.barPurchases,
            { width: `${Math.round((1 - salesShare) * 100)}%`, backgroundColor: theme.colors.primary },
          ]}
        />
      </View>

      <View style={styles.legendRow}>
        <LegendDot color={theme.colors.success} label="Sales share" />
        <LegendDot color={theme.colors.primary} label="Purchase share" />
      </View>
    </View>
  );
}

function MetricBlock({ label, value, color }: { label: string; value: string; color: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
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
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 14,
      gap: 8,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
    },
    forecastPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.primaryMuted,
    },
    forecastPillText: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
    },
    metricsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 14,
      gap: 8,
    },
    metricBlock: {
      flex: 1,
      alignItems: 'center' as const,
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      marginBottom: 4,
      textTransform: 'uppercase' as const,
    },
    metricValue: {
      fontSize: theme.scaleFont(14),
      fontWeight: '800' as const,
      textAlign: 'center' as const,
    },
    barTrack: {
      flexDirection: 'row' as const,
      height: 8,
      borderRadius: 999,
      overflow: 'hidden' as const,
      backgroundColor: theme.colors.background,
      marginBottom: 10,
    },
    barSales: {
      height: '100%' as const,
    },
    barPurchases: {
      height: '100%' as const,
    },
    legendRow: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 16,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
    },
  };
}
