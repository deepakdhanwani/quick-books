import { Pressable, Text, View } from 'react-native';
import { Input } from './Input';
import type { OpeningBalanceNature } from '../services/api';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';

type OpeningBalanceFieldsProps = {
  mode: 'customer' | 'vendor';
  amount: string;
  nature: OpeningBalanceNature;
  onAmountChange: (value: string) => void;
  onNatureChange: (value: OpeningBalanceNature) => void;
};

const CUSTOMER_OPTIONS: { value: OpeningBalanceNature; label: string; hint: string }[] = [
  { value: 'TO_RECEIVE', label: 'Customer owes you', hint: 'Recorded as debit / receivable' },
  { value: 'TO_PAY', label: 'You owe customer', hint: 'Recorded as credit / advance' },
];

const VENDOR_OPTIONS: { value: OpeningBalanceNature; label: string; hint: string }[] = [
  { value: 'TO_PAY', label: 'You owe vendor', hint: 'Recorded as credit / payable' },
  { value: 'TO_RECEIVE', label: 'Vendor owes you', hint: 'Recorded as debit / advance paid' },
];

export function OpeningBalanceFields({
  mode,
  amount,
  nature,
  onAmountChange,
  onNatureChange,
}: OpeningBalanceFieldsProps) {
  const styles = useThemedStyles(createStyles);
  const options = mode === 'customer' ? CUSTOMER_OPTIONS : VENDOR_OPTIONS;
  const selected = options.find((option) => option.value === nature) ?? options[0];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Opening Balance</Text>
      <Text style={styles.sectionHint}>
        Optional starting balance before invoices or bills in this app.
      </Text>
      <Input
        label="Amount"
        value={amount}
        onChangeText={onAmountChange}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <Text style={styles.natureLabel}>Balance type</Text>
      <View style={styles.optionList}>
        {options.map((option) => {
          const active = nature === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onNatureChange(option.value)}
            >
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{option.label}</Text>
              <Text style={styles.optionHint}>{option.hint}</Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? <Text style={styles.selectedHint}>Selected: {selected.label}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    section: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '600' as const,
      marginBottom: 4,
    },
    sectionHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginBottom: 12,
    },
    natureLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
      marginBottom: 8,
      marginTop: 4,
    },
    optionList: {
      gap: 8,
    },
    option: {
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
    optionTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
      marginBottom: 2,
    },
    optionTitleActive: {
      color: theme.colors.primary,
    },
    optionHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      lineHeight: theme.scaleFont(16),
    },
    selectedHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      marginTop: 10,
    },
  };
}
