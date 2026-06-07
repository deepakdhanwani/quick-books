import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createAppTheme } from './palettes';
import type { AppTheme, UserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './types';

type AppThemeContextValue = {
  theme: AppTheme;
  preferences: UserPreferences;
  setPreferences: (next: UserPreferences) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

type AppThemeProviderProps = {
  children: ReactNode;
  initialPreferences?: UserPreferences;
};

export function AppThemeProvider({ children, initialPreferences }: AppThemeProviderProps) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(
    initialPreferences ?? DEFAULT_PREFERENCES,
  );

  useEffect(() => {
    if (initialPreferences) {
      setPreferencesState(initialPreferences);
    }
  }, [initialPreferences?.fontSize, initialPreferences?.theme]);

  const setPreferences = useCallback((next: UserPreferences) => {
    setPreferencesState(next);
  }, []);

  const theme = useMemo(() => createAppTheme(preferences), [preferences]);

  const value = useMemo(
    () => ({
      theme,
      preferences,
      setPreferences,
    }),
    [preferences, setPreferences, theme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const context = useContext(AppThemeContext);
  if (!context) {
    return createAppTheme(DEFAULT_PREFERENCES);
  }
  return context.theme;
}

export function useUserPreferences() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within AppThemeProvider');
  }
  return {
    preferences: context.preferences,
    setPreferences: context.setPreferences,
  };
}
