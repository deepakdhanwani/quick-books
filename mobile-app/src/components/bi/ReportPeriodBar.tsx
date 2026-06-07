import { Pressable, ScrollView, Text, View } from 'react-native';
import type { AppliedDateFilter } from '../../utils/dateListFilter';
import { getPeriodCaption, isExtendedPeriod, ReportPeriodFilter } from './ReportPeriodFilter';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

export type QuickPeriodPreset = 'month' | '30d' | '90d';

type ReportPeriodBarProps = {
  quickPreset: QuickPeriodPreset;
  dateFilter: AppliedDateFilter;
  onQuickPresetChange: (preset: QuickPeriodPreset) => void;
  onExtendedFilterApply: (filter: AppliedDateFilter) => void;
};

const QUICK_PRESETS: { id: QuickPeriodPreset; label: string }[] = [
  { id: 'month', label: 'This Month' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
];

export function ReportPeriodBar({
  quickPreset,
  dateFilter,
  onQuickPresetChange,
  onExtendedFilterApply,
}: ReportPeriodBarProps) {
  const styles = useThemedStyles(createStyles);
  const extendedActive = isExtendedPeriod(dateFilter.mode);
  const caption = getPeriodCaption(dateFilter);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {QUICK_PRESETS.map((item) => {
          const active = !extendedActive && quickPreset === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onQuickPresetChange(item.id)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
        <ReportPeriodFilter
          value={dateFilter}
          active={extendedActive}
          onApply={onExtendedFilterApply}
        />
      </ScrollView>
      {caption ? <Text style={styles.caption}>Period: {caption}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingRight: 4,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    pillActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    pillText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    pillTextActive: {
      color: theme.colors.primary,
    },
    caption: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
    },
  };
}
