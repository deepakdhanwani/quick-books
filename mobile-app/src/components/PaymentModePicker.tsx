import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PaymentMode } from '../services/api';
import { colors } from '../theme/colors';

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
                color={selected ? colors.primary : colors.textSecondary}
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

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    minWidth: 0,
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  modeChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  modeChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
