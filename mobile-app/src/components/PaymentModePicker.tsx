import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PaymentMode } from '../services/api';
type PaymentModePickerProps = {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
};

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'CASH', label: 'Cash', icon: 'cash-outline' },
  { value: 'UPI', label: 'UPI', icon: 'phone-portrait-outline' },
  { value: 'BANK_TRANSFER', label: 'Bank', icon: 'business-outline' },
];

export function PaymentModePicker({ value, onChange }: PaymentModePickerProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View>
      <Text style={styles.sectionLabel}>Payment Mode *</Text>
      <View style={styles.modeRow}>
        {PAYMENT_MODES.map((mode) => {
          const selected = value === mode.value;
          return (
            <Pressable
              key={mode.value}
              style={[styles.modeChip, selected && styles.modeChipActive]}
              onPress={() => onChange(mode.value)}
            >
              <Ionicons
                name={mode.icon}
                size={14}
                color={selected ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.modeChipText, selected && styles.modeChipTextActive]}>
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  sectionLabel: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    minWidth: 0,
  },
  modeChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  modeChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(11),
    fontWeight: '500',
  },
  modeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  };
}
