import { StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { colors } from '../theme/colors';

type SubscriptionScreenProps = {
  status: 'NONE' | 'EXPIRED';
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function SubscriptionScreen({ status, refreshing, onRefresh }: SubscriptionScreenProps) {
  const title = status === 'NONE' ? 'Choose a Subscription Plan' : 'Renew Your Subscription';
  const message =
    status === 'NONE'
      ? 'Select a plan when you are ready. Subscription is optional and can be managed anytime.'
      : 'Your subscription has expired. Renew when you are ready.';

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{message}</Text>
        <Text style={styles.hint}>Plan selection will be implemented in the next phase.</Text>
        <Button title="Browse Plans" onPress={() => {}} />
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  hint: {
    color: colors.warning,
    marginBottom: 20,
  },
});
