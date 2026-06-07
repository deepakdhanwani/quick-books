import { ReactNode } from 'react';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { StyleSheet, View, ViewStyle } from 'react-native';
type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  const styles = useThemedStyles(createStyles);

  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(theme: AppTheme) {
  return {
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  };
}
