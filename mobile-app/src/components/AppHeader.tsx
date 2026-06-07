import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
};

export function AppHeader({ title, subtitle, onMenuPress, onBackPress }: AppHeaderProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  return (
    <View style={[styles.container, { paddingTop: topInset + 12 }]}>
      {onBackPress ? (
        <Pressable style={styles.iconButton} onPress={onBackPress} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
      ) : onMenuPress ? (
        <Pressable style={styles.iconButton} onPress={onMenuPress} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={24} color={theme.colors.text} />
        </Pressable>
      ) : (
        <View style={styles.iconSpacer} />
      )}

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.iconSpacer} />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  iconSpacer: {
    width: 40,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(18),
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginTop: 2,
  },

  };
}
