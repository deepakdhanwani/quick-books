import { Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, onPress, loading, variant = 'primary' }: ButtonProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={[styles.button, variant === 'secondary' && styles.secondary]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? theme.colors.text : theme.colors.onPrimary} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return {
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  text: {
    color: theme.colors.onPrimary,
    fontSize: theme.scaleFont(16),
    fontWeight: '600',
  },
  secondaryText: {
    color: theme.colors.text,
  },

  };
}
