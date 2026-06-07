import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PaymentListFilter } from '../services/api';
import { colors } from '../theme/colors';

const FILTER_OPTIONS: { value: PaymentListFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
];

type PaymentListFilterChipsProps = {
  value: PaymentListFilter;
  onChange: (value: PaymentListFilter) => void;
};

export function PaymentListFilterChips({ value, onChange }: PaymentListFilterChipsProps) {
  return (
    <View style={styles.row}>
      {FILTER_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.chip, selected && styles.chipActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
  },
});
