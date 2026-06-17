import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from './Button';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { toIsoDate, validateRangeDates } from '../utils/dateListFilter';

type SnoozeReminderModalProps = {
  visible: boolean;
  customerName?: string;
  onClose: () => void;
  onConfirm: (snoozedUntil: string) => void | Promise<void>;
  saving?: boolean;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function SnoozeReminderModal({
  visible,
  customerName,
  onClose,
  onConfirm,
  saving = false,
}: SnoozeReminderModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [snoozedUntil, setSnoozedUntil] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSnoozedUntil(toIsoDate(addDays(new Date(), 1)));
    setError('');
  }, [visible]);

  const handleQuickPick = (days: number) => {
    setSnoozedUntil(toIsoDate(addDays(new Date(), days)));
    setError('');
  };

  const handleConfirm = async () => {
    const validationError = validateRangeDates(snoozedUntil.trim(), snoozedUntil.trim());
    if (validationError) {
      setError('Enter a valid date (YYYY-MM-DD)');
      return;
    }

    const picked = new Date(`${snoozedUntil.trim()}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (picked <= today) {
      setError('Snooze date must be in the future');
      return;
    }

    await onConfirm(snoozedUntil.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Snooze reminder</Text>
          {customerName ? (
            <Text style={styles.subtitle}>Follow up with {customerName} on a new date.</Text>
          ) : (
            <Text style={styles.subtitle}>Choose when to follow up again.</Text>
          )}

          <View style={styles.quickRow}>
            <Pressable style={styles.quickChip} onPress={() => handleQuickPick(1)}>
              <Text style={styles.quickChipText}>Tomorrow</Text>
            </Pressable>
            <Pressable style={styles.quickChip} onPress={() => handleQuickPick(3)}>
              <Text style={styles.quickChipText}>3 days</Text>
            </Pressable>
            <Pressable style={styles.quickChip} onPress={() => handleQuickPick(7)}>
              <Text style={styles.quickChipText}>1 week</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Snooze until</Text>
          <TextInput
            style={styles.input}
            value={snoozedUntil}
            onChangeText={setSnoozedUntil}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} />
            <Button title="Snooze" onPress={handleConfirm} loading={saving} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center' as const,
      padding: 24,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20,
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
      lineHeight: theme.scaleFont(18),
    },
    quickRow: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 4,
    },
    quickChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      alignItems: 'center' as const,
    },
    quickChipText: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
      marginTop: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceElevated,
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(13),
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 10,
      marginTop: 8,
    },
  };
}
