import type { ColorPalette, FontSizeMode, ThemeMode, UserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './types';

export const darkColors: ColorPalette = {
  background: '#0f1419',
  surface: '#1a2332',
  surfaceElevated: '#243044',
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  onPrimary: '#f8fafc',
  primaryMuted: 'rgba(59, 130, 246, 0.15)',
  primarySurface: 'rgba(59, 130, 246, 0.1)',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#2d3748',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

export const lightColors: ColorPalette = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#f1f5f9',
  primary: '#4f6278',
  primaryDark: '#3f4f61',
  onPrimary: '#ffffff',
  primaryMuted: 'rgba(79, 98, 120, 0.12)',
  primarySurface: 'rgba(79, 98, 120, 0.08)',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

const FONT_SCALE: Record<FontSizeMode, number> = {
  EXTRA_SMALL: 0.85,
  SMALL: 1,
  LARGE: 1.15,
};

export function getPalette(mode: ThemeMode): ColorPalette {
  return mode === 'LIGHT' ? lightColors : darkColors;
}

export function createAppTheme(preferences: UserPreferences = DEFAULT_PREFERENCES) {
  const scale = FONT_SCALE[preferences.fontSize] ?? 1;
  return {
    mode: preferences.theme,
    fontSize: preferences.fontSize,
    colors: getPalette(preferences.theme),
    scaleFont: (size: number) => Math.round(size * scale),
  };
}

export function getStatusBarStyle(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'LIGHT' ? 'dark' : 'light';
}
