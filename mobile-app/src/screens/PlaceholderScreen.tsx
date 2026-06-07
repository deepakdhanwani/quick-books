import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { colors } from '../theme/colors';

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
  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{description}</Text>
        <Text style={styles.hint}>This module will be available in an upcoming release.</Text>
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
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
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  hint: {
    color: colors.warning,
    fontSize: 13,
    textAlign: 'center',
  },
});
