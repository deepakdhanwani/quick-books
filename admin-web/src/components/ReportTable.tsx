import { StyleSheet, Text, View } from 'react-native';
import { AdminReport } from '../services/api';
import { colors } from '../theme/colors';

type ReportTableProps = {
  report: AdminReport;
  emptyText?: string;
};

export function ReportTable({ report, emptyText = 'No records found' }: ReportTableProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Table View</Text>
      {report.rows.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {report.columns.map((column) => (
              <Text
                key={column.key}
                style={[
                  styles.headerCell,
                  styles.column,
                  column.align === 'right' ? styles.alignRight : styles.alignLeft,
                ]}
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
                    styles.dataCell,
                    styles.column,
                    column.align === 'right' ? styles.alignRight : styles.alignLeft,
                  ]}
                  numberOfLines={3}
                >
                  {row[column.key] ?? '—'}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
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
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  table: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dataRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  headerCell: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingRight: 10,
  },
  dataCell: {
    color: colors.text,
    fontSize: 14,
    paddingRight: 10,
  },
  alignLeft: {
    textAlign: 'left',
  },
  alignRight: {
    textAlign: 'right',
  },
});
