import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import type { ForecastMetric } from '../../services/api';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatCurrency } from '../../utils/saleAmounts';

type ForecastStripProps = {
  forecasts: ForecastMetric[];
};

function trendMeta(changePercent: number) {
  if (changePercent > 1) {
    return { icon: 'trending-up' as const, colorKey: 'success' as const, text: `+${Math.round(changePercent)}%` };
  }
  if (changePercent < -1) {
    return { icon: 'trending-down' as const, colorKey: 'error' as const, text: `${Math.round(changePercent)}%` };
  }
  return { icon: 'remove-outline' as const, colorKey: 'textSecondary' as const, text: 'Flat' };
}

export function ForecastStrip({ forecasts }: ForecastStripProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (forecasts.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Forecasts</Text>
      <Text style={styles.subtitle}>Projected month-end and next-month outlook based on your current pace</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {forecasts.map((item) => {
          const trend = trendMeta(item.changePercent);
          const trendColor =
            trend.colorKey === 'success'
              ? theme.colors.success
              : trend.colorKey === 'error'
                ? theme.colors.error
                : theme.colors.textSecondary;

          return (
            <View key={item.key} style={styles.card}>
              <Text style={styles.period}>{item.period}</Text>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.projected}>{formatCurrency(item.projectedValue)}</Text>
              <Text style={styles.current}>MTD {formatCurrency(item.currentValue)}</Text>
              <View style={styles.trendRow}>
                <Ionicons name={trend.icon} size={14} color={trendColor} />
                <Text style={[styles.trendText, { color: trendColor }]}>{trend.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
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
      marginBottom: 12,
    },
    strip: {
      gap: 12,
      paddingRight: 4,
    },
    card: {
      width: 168,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    period: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
      marginBottom: 6,
      textTransform: 'uppercase' as const,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      marginBottom: 8,
      minHeight: 32,
    },
    projected: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(20),
      fontWeight: '800' as const,
      marginBottom: 4,
    },
    current: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      marginBottom: 8,
    },
    trendRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    trendText: {
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
  };
}
