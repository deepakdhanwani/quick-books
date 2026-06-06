import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChartPoint } from '../services/api';
import { colors } from '../theme/colors';

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
};

function ChartBarRow({ label, value, maxValue, valuePrefix }: ChartBarRowProps) {
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
        {barWidth > 0 ? <View style={[styles.barFill, { width: barWidth }]} /> : null}
      </View>
      <Text style={styles.value}>
        {valuePrefix}
        {formatChartValue(value)}
      </Text>
    </View>
  );
}

export function ReportChart({
  title = 'Chart View',
  data,
  valuePrefix = '',
  emptyText = 'No chart data for the selected filters',
}: ReportChartProps) {
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartPanel: {
    width: '100%',
    minHeight: 180,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 24,
    textAlign: 'center',
  },
  chart: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  label: {
    width: 128,
    color: colors.textSecondary,
    fontSize: 13,
  },
  barTrack: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  value: {
    width: 96,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginLeft: 12,
  },
});
