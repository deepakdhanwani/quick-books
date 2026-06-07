import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { StyleSheet, Text, View } from 'react-native';
type StatCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: string;
};

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const accentColor = accent ?? theme.colors.primary;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
        <Ionicons name={icon} size={18} color={accentColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 100,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(20),
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
  },

  };
}
