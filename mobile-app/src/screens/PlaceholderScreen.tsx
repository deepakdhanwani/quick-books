import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
type PlaceholderScreenProps = {
  title: string;
  description: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function PlaceholderScreen({
  title,
  description,
  refreshing,
  onRefresh,
}: PlaceholderScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{description}</Text>
        <Text style={styles.hint}>This module will be available in an upcoming release.</Text>
      </Card>
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
  },
  card: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(22),
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.scaleFont(22),
    marginBottom: 12,
  },
  hint: {
    color: theme.colors.warning,
    fontSize: theme.scaleFont(13),
    textAlign: 'center',
  },

  };
}
