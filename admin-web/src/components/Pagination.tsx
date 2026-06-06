import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Select } from './Select';
import { colors } from '../theme/colors';

export const PAGE_SIZE_OPTIONS = [
  { label: '10 per page', value: '10' },
  { label: '25 per page', value: '25' },
  { label: '50 per page', value: '50' },
  { label: '100 per page', value: '100' },
];

type PaginationProps = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function Pagination({
  page,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalElements === 0) {
    return null;
  }

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);
  const displayPage = page + 1;
  const displayTotalPages = Math.max(totalPages, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        Showing {from}–{to} of {totalElements}
      </Text>

      <View style={styles.controls}>
        <View style={styles.pageSize}>
          <Select
            label="Page size"
            value={String(pageSize)}
            options={PAGE_SIZE_OPTIONS}
            onChange={(value) => onPageSizeChange(Number(value))}
          />
        </View>

        <View style={styles.nav}>
          <Button
            title="Previous"
            variant="secondary"
            disabled={page <= 0}
            onPress={() => onPageChange(page - 1)}
          />
          <Text style={styles.pageInfo}>
            Page {displayPage} of {displayTotalPages}
          </Text>
          <Button
            title="Next"
            variant="secondary"
            disabled={page >= totalPages - 1}
            onPress={() => onPageChange(page + 1)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  pageSize: {
    width: 180,
    minWidth: 160,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageInfo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 110,
    textAlign: 'center',
  },
});
