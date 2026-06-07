import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme } from './AppThemeContext';
import type { AppTheme } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThemedStyles(factory: (theme: AppTheme) => Record<string, object>): any {
  const theme = useAppTheme();

  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}
