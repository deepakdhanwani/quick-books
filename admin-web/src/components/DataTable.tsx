import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export type DataTableColumn<T> = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  flex?: number;
  minWidth?: number;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string | number;
  emptyText?: string;
};

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyText = 'No records found',
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {columns.map((column) => (
          <View
            key={column.key}
            style={[
              styles.cell,
              column.flex ? { flex: column.flex } : styles.defaultCell,
              column.minWidth ? { minWidth: column.minWidth } : null,
            ]}
          >
            <Text
              style={[
                styles.headerCell,
                column.align === 'right' ? styles.alignRight : styles.alignLeft,
              ]}
            >
              {column.label}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((row) => (
        <View key={keyExtractor(row)} style={styles.dataRow}>
          {columns.map((column) => (
            <View
              key={column.key}
              style={[
                styles.cell,
                column.flex ? { flex: column.flex } : styles.defaultCell,
                column.minWidth ? { minWidth: column.minWidth } : null,
              ]}
            >
              {column.render ? (
                column.render(row)
              ) : (
                <Text
                  style={[
                    styles.dataCell,
                    column.align === 'right' ? styles.alignRight : styles.alignLeft,
                  ]}
                  numberOfLines={3}
                >
                  {String((row as Record<string, unknown>)[column.key] ?? '—')}
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  defaultCell: {
    flex: 1,
    minWidth: 100,
  },
  headerCell: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dataCell: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  alignLeft: { textAlign: 'left' },
  alignRight: { textAlign: 'right' },
  empty: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
