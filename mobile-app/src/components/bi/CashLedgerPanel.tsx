import { Text, View } from 'react-native';
import type { BusinessReport } from '../../services/api';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { ReportSummaryGrid } from '../ReportSummaryGrid';
import { ReportTable } from '../ReportTable';
import { TrendChart } from './TrendChart';

type CashLedgerPanelProps = {
  title: string;
  subtitle: string;
  report: BusinessReport;
  emptyText?: string;
};

export function CashLedgerPanel({ title, subtitle, report, emptyText }: CashLedgerPanelProps) {
  const styles = useThemedStyles(createStyles);
  const hasRows = report.rows.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <ReportSummaryGrid items={report.summary} />

      {hasRows ? (
        <>
          <View style={styles.chartBlock}>
            <Text style={styles.chartTitle}>Concentration — top 5 accounts</Text>
            <Text style={styles.chartHint}>
              Visual only. Use the priority ledger below for open documents, share %, and action level.
            </Text>
            <TrendChart
              title=""
              data={report.chartData}
              emptyText="No concentration data"
            />
          </View>

          <View style={styles.tableBlock}>
            <Text style={styles.tableTitle}>Priority ledger</Text>
            <ReportTable report={report} emptyText={emptyText} compact scrollable />
          </View>
        </>
      ) : (
        <ReportTable report={report} emptyText={emptyText} compact scrollable />
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      gap: 12,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginBottom: 4,
    },
    chartBlock: {
      gap: 6,
    },
    chartTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
    },
    chartHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      lineHeight: theme.scaleFont(16),
      marginBottom: 4,
    },
    tableBlock: {
      gap: 8,
    },
    tableTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
    },
  };
}
