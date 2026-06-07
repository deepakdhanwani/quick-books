import { Pressable, ScrollView, Text } from 'react-native';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.id)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    row: {
      gap: 8,
      paddingBottom: 2,
    },
    segment: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minWidth: 96,
      alignItems: 'center' as const,
    },
    segmentActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    segmentText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      fontWeight: '600' as const,
    },
    segmentTextActive: {
      color: theme.colors.primary,
    },
  };
}
