import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
export type StatusFilter = 'all' | 'active' | 'inactive';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

type StatusFilterChipsProps = {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
};

export function StatusFilterChips({ value, onChange }: StatusFilterChipsProps) {
  const styles = useThemedStyles(createStyles);

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

function createStyles(theme: AppTheme) {
  return {
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.primary,
  },

  };
}
