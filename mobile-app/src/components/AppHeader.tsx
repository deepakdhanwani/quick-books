import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
};

export function AppHeader({ title, subtitle, onMenuPress, onBackPress }: AppHeaderProps) {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  return (
    <View style={[styles.container, { paddingTop: topInset + 12 }]}>
      {onBackPress ? (
        <Pressable style={styles.iconButton} onPress={onBackPress} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : onMenuPress ? (
        <Pressable style={styles.iconButton} onPress={onMenuPress} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={24} color={colors.text} />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  iconSpacer: {
    width: 40,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
