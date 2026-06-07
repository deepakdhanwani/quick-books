export type ThemeMode = 'DARK' | 'LIGHT';

export type FontSizeMode = 'LARGE' | 'SMALL' | 'EXTRA_SMALL';

export type ColorPalette = {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryDark: string;
  onPrimary: string;
  primaryMuted: string;
  primarySurface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
};

export type UserPreferences = {
  theme: ThemeMode;
  fontSize: FontSizeMode;
};

export type AppTheme = {
  mode: ThemeMode;
  fontSize: FontSizeMode;
  colors: ColorPalette;
  scaleFont: (size: number) => number;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'DARK',
  fontSize: 'SMALL',
};
