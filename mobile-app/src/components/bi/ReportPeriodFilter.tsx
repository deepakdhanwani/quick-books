import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { AppliedDateFilter, DateFilterMode } from '../../utils/dateListFilter';
import {
  getDateFilterLabel,
  toIsoDate,
  validateRangeDates,
} from '../../utils/dateListFilter';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

const EXTENDED_OPTIONS: { value: DateFilterMode; label: string; hint: string }[] = [
  { value: 'quarterly', label: 'Quarterly', hint: 'Current calendar quarter' },
  { value: 'halfYearly', label: 'Half Yearly', hint: 'Last 6 months' },
  { value: 'yearly', label: 'Yearly', hint: 'Year to date' },
  { value: 'lastYear', label: 'Last Year', hint: 'Previous calendar year' },
  { value: 'range', label: 'Custom Range', hint: 'Pick exact start and end dates' },
];

type ReportPeriodFilterProps = {
  value: AppliedDateFilter;
  active: boolean;
  onApply: (filter: AppliedDateFilter) => void;
};

export function ReportPeriodFilter({ value, active, onApply }: ReportPeriodFilterProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [visible, setVisible] = useState(false);
  const [draftMode, setDraftMode] = useState<DateFilterMode>(
    value.mode === 'none' || value.mode === 'month' ? 'quarterly' : value.mode,
  );
  const [draftFromDate, setDraftFromDate] = useState(value.fromDate ?? toIsoDate(new Date()));
  const [draftToDate, setDraftToDate] = useState(value.toDate ?? toIsoDate(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDraftMode(value.mode === 'none' || value.mode === 'month' ? 'quarterly' : value.mode);
    setDraftFromDate(value.fromDate ?? toIsoDate(new Date()));
    setDraftToDate(value.toDate ?? toIsoDate(new Date()));
    setError('');
  }, [visible, value]);

  const close = () => setVisible(false);

  const handleApply = () => {
    if (draftMode === 'range') {
      const validationError = validateRangeDates(draftFromDate.trim(), draftToDate.trim());
      if (validationError) {
        setError(validationError);
        return;
      }
      onApply({ mode: 'range', fromDate: draftFromDate.trim(), toDate: draftToDate.trim() });
      close();
      return;
    }

    onApply({ mode: draftMode });
    close();
  };

  return (
    <>
      <Pressable
        style={[styles.filterButton, active && styles.filterButtonActive]}
        onPress={() => setVisible(true)}
        accessibilityLabel="More period filters"
      >
        <Ionicons name="options-outline" size={20} color={active ? theme.colors.primary : theme.colors.text} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Period filters</Text>
            <Text style={styles.subtitle}>Quarterly, yearly, and custom ranges for deeper analysis.</Text>

            <View style={styles.options}>
              {EXTENDED_OPTIONS.map((option) => {
                const selected = draftMode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, selected && styles.optionActive]}
                    onPress={() => {
                      setDraftMode(option.value);
                      setError('');
                    }}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option.label}</Text>
                      <Text style={styles.optionHint}>{option.hint}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {draftMode === 'range' ? (
              <View style={styles.rangeFields}>
                <View style={styles.rangeField}>
                  <Text style={styles.rangeLabel}>From</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={draftFromDate}
                    onChangeText={setDraftFromDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.rangeField}>
                  <Text style={styles.rangeLabel}>To</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={draftToDate}
                    onChangeText={setDraftToDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply period</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function isExtendedPeriod(mode: AppliedDateFilter['mode']) {
  return mode === 'quarterly' || mode === 'halfYearly' || mode === 'yearly' || mode === 'lastYear' || mode === 'range';
}

export function getPeriodCaption(filter: AppliedDateFilter) {
  if (filter.mode === 'none') return '';
  return getDateFilterLabel(filter);
}

function createStyles(theme: AppTheme) {
  return {
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
    },
    filterButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center' as const,
      padding: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(18),
      fontWeight: '700' as const,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
    },
    options: {
      gap: 8,
    },
    option: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    optionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    optionTextWrap: {
      flex: 1,
      paddingRight: 10,
    },
    optionText: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
    },
    optionTextActive: {
      color: theme.colors.primary,
    },
    optionHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      marginTop: 2,
    },
    radio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    radioActive: {
      borderColor: theme.colors.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    rangeFields: {
      flexDirection: 'row' as const,
      gap: 10,
    },
    rangeField: {
      flex: 1,
      gap: 6,
    },
    rangeLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    rangeInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      fontSize: theme.scaleFont(14),
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(13),
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    applyButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
  };
}
