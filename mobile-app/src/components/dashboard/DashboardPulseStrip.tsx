import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type DashboardPulseStripProps = {
  score: number;
  label: string;
  summary: string;
  onPress?: () => void;
};

function scoreColor(score: number, theme: AppTheme) {
  if (score >= 80) return theme.colors.success;
  if (score >= 65) return theme.colors.primary;
  if (score >= 45) return theme.colors.warning;
  return theme.colors.error;
}

export function DashboardPulseStrip({ score, label, summary, onPress }: DashboardPulseStripProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const accent = scoreColor(score, theme);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed, { borderColor: `${accent}44` }]}
      onPress={onPress}
    >
      <View style={[styles.ring, { borderColor: accent }]}>
        <Text style={[styles.score, { color: accent }]}>{score}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Ionicons name="pulse-outline" size={16} color={accent} />
          <Text style={[styles.label, { color: accent }]}>{label}</Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {summary}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return {
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    pressed: {
      opacity: 0.92,
    },
    ring: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 3,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.background,
    },
    score: {
      fontSize: theme.scaleFont(18),
      fontWeight: '800' as const,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    labelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    label: {
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
    summary: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
    },
  };
}
