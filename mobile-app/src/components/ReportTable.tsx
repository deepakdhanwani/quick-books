import { ScrollView, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { AppTheme } from '../theme/types';
import type { BusinessReport, ReportColumn } from '../services/api';
import { formatCurrency, parseAmount } from '../utils/saleAmounts';

type ReportTableProps = {
  report: BusinessReport;
  emptyText?: string;
  compact?: boolean;
  scrollable?: boolean;
};

const COLUMN_WIDTH: Record<string, number> = {
  rank: 34,
  customer: 118,
  vendor: 118,
  product: 118,
  metric: 110,
  orders: 52,
  openDocs: 48,
  amount: 86,
  revenue: 86,
  spend: 86,
  current: 86,
  previous: 86,
  share: 58,
  growth: 58,
  change: 58,
  quantity: 56,
  priority: 68,
};

function columnWidth(column: ReportColumn) {
  return COLUMN_WIDTH[column.key] ?? (column.align === 'right' ? 72 : 96);
}

function formatCellValue(key: string, value: string) {
  if (
    key === 'amount' ||
    key === 'revenue' ||
    key === 'spend' ||
    key === 'current' ||
    key === 'previous' ||
    key.includes('amount') ||
    key.includes('revenue') ||
    key.includes('spend')
  ) {
    const parsed = parseAmount(value);
    if (Number.isFinite(parsed)) {
      return formatCurrency(parsed);
    }
  }
  return value || '—';
}

export function ReportTable({
  report,
  emptyText = 'No records for this period',
  compact = true,
  scrollable = true,
}: ReportTableProps) {
  const styles = useThemedStyles(createStyles);
  const headerSize = compact ? styles.headerCellCompact : styles.headerCell;
  const dataSize = compact ? styles.dataCellCompact : styles.dataCell;
  const tableMinWidth = report.columns.reduce((sum, column) => sum + columnWidth(column), 0);

  if (report.rows.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const tableBody = (
    <View style={[styles.table, { minWidth: tableMinWidth }]}>
      <View style={styles.headerRow}>
        {report.columns.map((column) => (
          <Text
            key={column.key}
            style={[
              headerSize,
              column.align === 'right' ? styles.alignRight : styles.alignLeft,
              { width: columnWidth(column) },
            ]}
            numberOfLines={1}
          >
            {column.label}
          </Text>
        ))}
      </View>

      {report.rows.map((row, index) => (
        <View key={`row-${index}`} style={styles.dataRow}>
          {report.columns.map((column) => (
            <Text
              key={column.key}
              style={[
                dataSize,
                column.align === 'right' ? styles.alignRight : styles.alignLeft,
                { width: columnWidth(column) },
              ]}
              numberOfLines={1}
            >
              {formatCellValue(column.key, row[column.key] ?? '')}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  if (!scrollable) {
    return tableBody;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.scrollContent}>
      {tableBody}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    scrollContent: {
      flexGrow: 1,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      overflow: 'hidden' as const,
    },
    headerRow: {
      flexDirection: 'row' as const,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    dataRow: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.surface,
    },
    headerCell: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
    headerCellCompact: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(9),
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
    },
    dataCell: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(18),
    },
    dataCellCompact: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(11),
      lineHeight: theme.scaleFont(14),
    },
    alignLeft: {
      textAlign: 'left' as const,
    },
    alignRight: {
      textAlign: 'right' as const,
    },
    emptyBox: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
      textAlign: 'center' as const,
    },
  };
}
