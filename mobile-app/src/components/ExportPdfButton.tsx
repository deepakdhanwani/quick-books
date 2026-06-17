import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';

type ExportPdfButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function ExportPdfButton({ label, onPress, disabled = false }: ExportPdfButtonProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return {
    button: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
  };
}
