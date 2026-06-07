import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { BusinessInsight } from '../../services/api';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type InsightFeedProps = {
  insights: BusinessInsight[];
};

function insightVisual(type: string, theme: AppTheme) {
  switch (type) {
    case 'FORECAST':
      return { icon: 'telescope-outline' as const, color: theme.colors.primary, label: 'Forecast' };
    case 'RISK':
      return { icon: 'warning-outline' as const, color: theme.colors.error, label: 'Risk' };
    case 'ACTION':
      return { icon: 'flash-outline' as const, color: theme.colors.warning, label: 'Action' };
    case 'OPPORTUNITY':
      return { icon: 'rocket-outline' as const, color: theme.colors.success, label: 'Opportunity' };
    default:
      return { icon: 'bulb-outline' as const, color: theme.colors.textSecondary, label: 'Insight' };
  }
}

export function InsightFeed({ insights }: InsightFeedProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Recommended Actions</Text>
      <Text style={styles.subtitle}>Forward-looking guidance to protect cash and capture growth</Text>
      <View style={styles.list}>
        {insights.slice(0, 6).map((insight, index) => {
          const visual = insightVisual(insight.type, theme);
          return (
            <View
              key={`${insight.title}-${index}`}
              style={[styles.card, { borderLeftColor: visual.color }]}
            >
              <View style={styles.header}>
                <View style={[styles.badge, { backgroundColor: `${visual.color}18` }]}>
                  <Ionicons name={visual.icon} size={16} color={visual.color} />
                  <Text style={[styles.badgeText, { color: visual.color }]}>{visual.label}</Text>
                </View>
                {insight.metric ? <Text style={styles.metric}>{insight.metric}</Text> : null}
              </View>
              <Text style={styles.cardTitle}>{insight.title}</Text>
              <Text style={styles.message}>{insight.message}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginBottom: 18,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginBottom: 12,
    },
    list: {
      gap: 10,
    },
    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 4,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      gap: 8,
    },
    badge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
    metric: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '700' as const,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
      marginBottom: 6,
    },
    message: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
    },
  };
}
