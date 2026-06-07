import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type QuickAction = {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'success' | 'primary' | 'warning' | 'info';
};

const ACTIONS: QuickAction[] = [
  {
    key: 'sale',
    label: 'New Sale',
    subtitle: 'Record revenue',
    icon: 'add-circle-outline',
    accent: 'success',
  },
  {
    key: 'purchase',
    label: 'New Purchase',
    subtitle: 'Log expense',
    icon: 'bag-add-outline',
    accent: 'primary',
  },
  {
    key: 'customer',
    label: 'Add Customer',
    subtitle: 'Grow book',
    icon: 'person-add-outline',
    accent: 'info',
  },
  {
    key: 'reports',
    label: 'Reports',
    subtitle: 'Full BI hub',
    icon: 'bar-chart-outline',
    accent: 'warning',
  },
];

type DashboardQuickActionsProps = {
  onAction: (key: string) => void;
};

export function DashboardQuickActions({ onAction }: DashboardQuickActionsProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const accentColor = (accent: QuickAction['accent']) => {
    switch (accent) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {ACTIONS.map((action) => {
          const color = accentColor(action.accent);
          return (
            <Pressable
              key={action.key}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => onAction(action.key)}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
                <Ionicons name={action.icon} size={22} color={color} />
              </View>
              <Text style={styles.label}>{action.label}</Text>
              <Text style={styles.subtitle}>{action.subtitle}</Text>
            </Pressable>
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
      marginBottom: 10,
    },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
    },
    card: {
      flexBasis: '47%' as const,
      flexGrow: 1,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 10,
    },
    label: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
      marginBottom: 2,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
    },
  };
}
