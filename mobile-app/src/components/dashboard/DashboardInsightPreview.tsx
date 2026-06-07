import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { BusinessInsight } from '../../services/api';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type DashboardInsightPreviewProps = {
  insights: BusinessInsight[];
  onViewAll?: () => void;
};

function insightVisual(type: string, theme: AppTheme) {
  switch (type) {
    case 'FORECAST':
      return { icon: 'telescope-outline' as const, color: theme.colors.primary };
    case 'RISK':
      return { icon: 'warning-outline' as const, color: theme.colors.error };
    case 'ACTION':
      return { icon: 'flash-outline' as const, color: theme.colors.warning };
    case 'OPPORTUNITY':
      return { icon: 'rocket-outline' as const, color: theme.colors.success };
    default:
      return { icon: 'bulb-outline' as const, color: theme.colors.textSecondary };
  }
}

export function DashboardInsightPreview({ insights, onViewAll }: DashboardInsightPreviewProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (insights.length === 0) {
    return null;
  }

  const topInsight =
    insights.find((item) => item.priority === 'HIGH') ??
    insights.find((item) => item.type === 'RISK') ??
    insights[0];
  const visual = insightVisual(topInsight.type, theme);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Priority Insight</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.card,
          { borderLeftColor: visual.color },
          pressed && styles.pressed,
        ]}
        onPress={onViewAll}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${visual.color}18` }]}>
          <Ionicons name={visual.icon} size={20} color={visual.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.cardTitle}>{topInsight.title}</Text>
          <Text style={styles.message} numberOfLines={3}>
            {topInsight.message}
          </Text>
          {topInsight.metric ? <Text style={styles.metric}>{topInsight.metric}</Text> : null}
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginBottom: 18,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
    },
    link: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(12),
      fontWeight: '700' as const,
    },
    card: {
      flexDirection: 'row' as const,
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 4,
      backgroundColor: theme.colors.surface,
    },
    pressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
    message: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
    },
    metric: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '700' as const,
      marginTop: 4,
    },
  };
}
