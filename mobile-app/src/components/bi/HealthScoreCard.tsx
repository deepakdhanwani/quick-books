import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type HealthScoreCardProps = {
  score: number;
  label: string;
  summary: string;
};

function scoreColor(score: number, theme: AppTheme) {
  if (score >= 80) return theme.colors.success;
  if (score >= 65) return theme.colors.primary;
  if (score >= 45) return theme.colors.warning;
  return theme.colors.error;
}

export function HealthScoreCard({ score, label, summary }: HealthScoreCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const accent = scoreColor(score, theme);

  return (
    <View style={[styles.card, { borderColor: `${accent}44` }]}>
      <View style={[styles.ring, { borderColor: accent }]}>
        <Text style={[styles.score, { color: accent }]}>{score}</Text>
      </View>

      <Text style={styles.eyebrow}>Business Pulse</Text>

      <View style={styles.labelRow}>
        <Ionicons
          name={score >= 65 ? 'pulse-outline' : 'alert-circle-outline'}
          size={18}
          color={accent}
        />
        <Text style={[styles.label, { color: accent }]}>{label}</Text>
      </View>

      <Text style={styles.summary}>{summary}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    card: {
      alignItems: 'center' as const,
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
      gap: 10,
    },
    ring: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.background,
      marginBottom: 4,
    },
    score: {
      fontSize: 30,
      fontWeight: '800' as const,
    },
    eyebrow: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    labelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    label: {
      fontSize: theme.scaleFont(20),
      fontWeight: '700' as const,
    },
    summary: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(20),
      textAlign: 'center' as const,
      width: '100%' as const,
    },
  };
}
