import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AppliedDateFilter,
  DateFilterMode,
  getClearedDateFilter,
  getDateFilterLabel,
  isDateFilterActive,
  toIsoDate,
  validateRangeDates,
} from '../utils/dateListFilter';
import { colors } from '../theme/colors';

const FILTER_OPTIONS: { value: DateFilterMode; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'range', label: 'Date range' },
];

type TransactionDateFilterProps = {
  value: AppliedDateFilter;
  onApply: (filter: AppliedDateFilter) => void;
  onClear: () => void;
};

export function TransactionDateFilter({ value, onApply, onClear }: TransactionDateFilterProps) {
  const [visible, setVisible] = useState(false);
  const [draftMode, setDraftMode] = useState<DateFilterMode>(value.mode === 'none' ? 'today' : value.mode);
  const [draftFromDate, setDraftFromDate] = useState(value.fromDate ?? toIsoDate(new Date()));
  const [draftToDate, setDraftToDate] = useState(value.toDate ?? toIsoDate(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftMode(value.mode === 'none' ? 'today' : value.mode);
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

      onApply({
        mode: 'range',
        fromDate: draftFromDate.trim(),
        toDate: draftToDate.trim(),
      });
      close();
      return;
    }

    onApply({ mode: draftMode });
    close();
  };

  const handleClear = () => {
    onClear();
    close();
  };

  const active = isDateFilterActive(value);

  return (
    <>
      <Pressable
        style={[styles.filterButton, active && styles.filterButtonActive]}
        onPress={() => setVisible(true)}
        accessibilityLabel="Filter by date"
      >
        <Ionicons name="filter-outline" size={20} color={active ? colors.primary : colors.text} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Filter by date</Text>
            <Text style={styles.subtitle}>Choose a preset or enter a custom date range.</Text>

            <View style={styles.options}>
              {FILTER_OPTIONS.map((option) => {
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
                    <View style={[styles.radio, selected && styles.radioActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option.label}</Text>
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
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.rangeField}>
                  <Text style={styles.rangeLabel}>To</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={draftToDate}
                    onChangeText={setDraftToDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable style={[styles.actionButton, styles.clearButton]} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.applyButton]} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function TransactionDateFilterSummary({ value }: { value: AppliedDateFilter }) {
  if (!isDateFilterActive(value)) {
    return null;
  }

  return <Text style={styles.summary}>Date: {getDateFilterLabel(value)}</Text>;
}

const styles = StyleSheet.create({
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.text,
  },
  rangeFields: {
    gap: 10,
  },
  rangeField: {
    gap: 6,
  },
  rangeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  summary: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
