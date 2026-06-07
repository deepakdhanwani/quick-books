import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type DashboardHeroProps = {
  greetingName: string;
  businessName: string;
  subscriptionLabel: string;
  subscriptionColor: string;
};

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTodayDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function DashboardHero({
  greetingName,
  businessName,
  subscriptionLabel,
  subscriptionColor,
}: DashboardHeroProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.hero}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.onPrimary} />
          <Text style={styles.badgeText}>Business Overview</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: `${subscriptionColor}66` }]}>
          <View style={[styles.statusDot, { backgroundColor: subscriptionColor }]} />
          <Text style={[styles.statusText, { color: subscriptionColor }]}>{subscriptionLabel}</Text>
        </View>
      </View>

      <Text style={styles.greeting}>
        {getTimeGreeting()}, {greetingName}
      </Text>
      <Text style={styles.business}>{businessName}</Text>
      <Text style={styles.date}>{formatTodayDate()}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    hero: {
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      overflow: 'hidden' as const,
      backgroundColor: theme.colors.primaryDark,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}55`,
    },
    glowTop: {
      position: 'absolute' as const,
      top: -40,
      right: -20,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: `${theme.colors.primary}33`,
    },
    glowBottom: {
      position: 'absolute' as const,
      bottom: -50,
      left: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: `${theme.colors.success}22`,
    },
    topRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 14,
      gap: 10,
    },
    badge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
    statusPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
    },
    greeting: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(26),
      fontWeight: '800' as const,
      letterSpacing: -0.3,
    },
    business: {
      color: 'rgba(248,250,252,0.88)',
      fontSize: theme.scaleFont(15),
      marginTop: 6,
      fontWeight: '500' as const,
    },
    date: {
      color: 'rgba(248,250,252,0.65)',
      fontSize: theme.scaleFont(13),
      marginTop: 8,
    },
  };
}
