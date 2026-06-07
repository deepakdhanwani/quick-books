import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ChartPoint } from '../services/api';

type ReportChartProps = {
  title?: string;
  data: ChartPoint[];
  valuePrefix?: string;
  emptyText?: string;
};

type ChartBarRowProps = {
  label: string;
  value: number;
  maxValue: number;
  valuePrefix: string;
  styles: ReturnType<typeof createStyles>;
  primaryColor: string;
};

function ChartBarRow({ label, value, maxValue, valuePrefix, styles, primaryColor }: ChartBarRowProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const ratio = maxValue > 0 ? value / maxValue : 0;
  const barWidth = ratio > 0 ? Math.max(trackWidth * ratio, 8) : 0;

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View
        style={styles.barTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        {barWidth > 0 ? (
          <View style={[styles.barFill, { width: barWidth, backgroundColor: primaryColor }]} />
        ) : null}
      </View>
      <Text style={styles.value}>
        {valuePrefix}
        {formatChartValue(value)}
      </Text>
    </View>
  );
}

export function ReportChart({
  title = 'Chart',
  data,
  valuePrefix = '',
  emptyText = 'No chart data for the selected period',
}: ReportChartProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const normalizedData = data.map((point) => ({
    label: point.label,
    value: Number(point.value) || 0,
  }));
  const maxValue = Math.max(...normalizedData.map((point) => point.value), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartPanel}>
        {normalizedData.length === 0 ? (
          <Text style={styles.empty}>{emptyText}</Text>
        ) : (
          <View style={styles.chart}>
            {normalizedData.map((point) => (
              <ChartBarRow
                key={point.label}
                label={point.label}
                value={point.value}
                maxValue={maxValue}
                valuePrefix={valuePrefix}
                styles={styles}
                primaryColor={theme.colors.primary}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function formatChartValue(value: number) {
  if (Number.isInteger(value)) {
    return value.toLocaleString('en-IN');
  }
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      width: '100%' as const,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 12,
    },
    chartPanel: {
      width: '100%' as const,
      minHeight: 160,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    empty: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
      fontStyle: 'italic' as const,
      paddingVertical: 24,
      textAlign: 'center' as const,
    },
    chart: {
      width: '100%' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      width: '100%' as const,
      marginBottom: 10,
    },
    label: {
      width: 100,
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
    },
    barTrack: {
      flex: 1,
      height: 24,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center' as const,
    },
    barFill: {
      height: '100%' as const,
      borderRadius: 8,
    },
    value: {
      width: 88,
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
      textAlign: 'right' as const,
      marginLeft: 8,
    },
  };
}
