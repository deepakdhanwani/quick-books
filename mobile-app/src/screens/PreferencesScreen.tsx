import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api } from '../services/api';
import { saveCachedPreferences } from '../services/preferenceStorage';
import { useAppTheme, useUserPreferences } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import type { FontSizeMode, ThemeMode } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'DARK', label: 'Dark' },
  { value: 'LIGHT', label: 'Light' },
];

const FONT_OPTIONS: { value: FontSizeMode; label: string }[] = [
  { value: 'LARGE', label: 'Large' },
  { value: 'SMALL', label: 'Small' },
  { value: 'EXTRA_SMALL', label: 'Extra small' },
];

type PreferencesScreenProps = {
  token: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function PreferencesScreen({ token, refreshing, onRefresh }: PreferencesScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { preferences, setPreferences } = useUserPreferences();
  const [draftTheme, setDraftTheme] = useState<ThemeMode>(preferences.theme);
  const [draftFontSize, setDraftFontSize] = useState<FontSizeMode>(preferences.fontSize);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDraftTheme(preferences.theme);
    setDraftFontSize(preferences.fontSize);
  }, [preferences.fontSize, preferences.theme]);

  const hasChanges = draftTheme !== preferences.theme || draftFontSize !== preferences.fontSize;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.updateUserPreferences(token, {
        theme: draftTheme,
        fontSize: draftFontSize,
      });
      const next = { theme: response.theme, fontSize: response.fontSize };
      setPreferences(next);
      await saveCachedPreferences(next);
      setSuccess('Preferences saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Text style={styles.description}>
        Choose how the app looks for your account. Team users can set their own preferences separately.
      </Text>

      <Text style={styles.sectionTitle}>Theme</Text>
      <Card style={styles.optionCard}>
        {THEME_OPTIONS.map((option) => {
          const selected = draftTheme === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.optionRow, selected && styles.optionRowActive]}
              onPress={() => setDraftTheme(option.value)}
            >
              <Ionicons
                name={option.value === 'DARK' ? 'moon-outline' : 'sunny-outline'}
                size={20}
                color={selected ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Text style={styles.sectionTitle}>Font size</Text>
      <Card style={styles.optionCard}>
        {FONT_OPTIONS.map((option) => {
          const selected = draftFontSize === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.optionRow, selected && styles.optionRowActive]}
              onPress={() => setDraftFontSize(option.value)}
            >
              <Ionicons
                name="text-outline"
                size={option.value === 'LARGE' ? 22 : option.value === 'SMALL' ? 18 : 14}
                color={selected ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable
        style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.saveButtonText}>Save preferences</Text>
        )}
      </Pressable>
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      flexGrow: 1,
      gap: 12,
    },
    description: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
      lineHeight: theme.scaleFont(20),
      marginBottom: 8,
    },
    sectionTitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    optionCard: {
      gap: 8,
      padding: 12,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    optionRowActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    optionLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(15),
      fontWeight: '600',
    },
    optionLabelActive: {
      color: theme.colors.primary,
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(13),
    },
    success: {
      color: theme.colors.success,
      fontSize: theme.scaleFont(13),
    },
    saveButton: {
      marginTop: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(16),
      fontWeight: '700',
    },
  };
}
