import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ChartPoint } from '../../services/api';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type TrendChartProps = {
  title: string;
  data: ChartPoint[];
  valuePrefix?: string;
  emptyText?: string;
};

function formatChartValue(value: number) {
  if (Number.isInteger(value)) {
    return value.toLocaleString('en-IN');
  }
  return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function TrendChart({
  title,
  data,
  valuePrefix = '₹',
  emptyText = 'Not enough history to chart yet',
}: TrendChartProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const normalized = data.map((point) => ({
    label: point.label,
    value: Number(point.value) || 0,
    projected: Boolean(point.projected),
  }));
  const maxValue = Math.max(...normalized.map((point) => point.value), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titleSpacer} />}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>Actual</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotProjected, { borderColor: theme.colors.warning }]} />
            <Text style={styles.legendText}>Forecast</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        {normalized.length === 0 ? (
          <Text style={styles.empty}>{emptyText}</Text>
        ) : (
          normalized.map((point) => (
            <ChartRow
              key={point.label}
              label={point.label}
              value={point.value}
              maxValue={maxValue}
              projected={point.projected}
              valuePrefix={valuePrefix}
              styles={styles}
              actualColor={theme.colors.primary}
              projectedColor={theme.colors.warning}
            />
          ))
        )}
      </View>
    </View>
  );
}

function ChartRow({
  label,
  value,
  maxValue,
  projected,
  valuePrefix,
  styles,
  actualColor,
  projectedColor,
}: {
  label: string;
  value: number;
  maxValue: number;
  projected: boolean;
  valuePrefix: string;
  styles: ReturnType<typeof createStyles>;
  actualColor: string;
  projectedColor: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const ratio = maxValue > 0 ? value / maxValue : 0;
  const barWidth = ratio > 0 ? Math.max(trackWidth * ratio, 6) : 0;
  const fillColor = projected ? projectedColor : actualColor;

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View
        style={[styles.track, projected && styles.trackProjected]}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        {barWidth > 0 ? (
          <View
            style={[
              styles.fill,
              { width: barWidth, backgroundColor: fillColor, opacity: projected ? 0.75 : 1 },
            ]}
          />
        ) : null}
      </View>
      <Text style={styles.value}>
        {valuePrefix}
        {formatChartValue(value)}
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      gap: 8,
      marginBottom: 10,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
      flex: 1,
    },
    titleSpacer: {
      flex: 1,
    },
    legend: {
      gap: 6,
      alignItems: 'flex-end' as const,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotProjected: {
      backgroundColor: 'transparent',
      borderWidth: 2,
    },
    legendText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
    },
    panel: {
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    empty: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      textAlign: 'center' as const,
      paddingVertical: 20,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
      gap: 8,
    },
    label: {
      width: 92,
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
    },
    track: {
      flex: 1,
      height: 22,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center' as const,
    },
    trackProjected: {
      borderStyle: 'dashed' as const,
    },
    fill: {
      height: '100%' as const,
      borderRadius: 8,
    },
    value: {
      width: 82,
      color: theme.colors.text,
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
      textAlign: 'right' as const,
    },
  };
}
