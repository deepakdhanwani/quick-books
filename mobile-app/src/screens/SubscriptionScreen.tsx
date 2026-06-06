import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChangePinScreen } from './ChangePinScreen';
import { colors } from '../theme/colors';

type SubscriptionScreenProps = {
  token: string;
  status: 'NONE' | 'EXPIRED';
  onLogout: () => void;
};

export function SubscriptionScreen({ token, status, onLogout }: SubscriptionScreenProps) {
  const [showChangePin, setShowChangePin] = useState(false);

  if (showChangePin) {
    return <ChangePinScreen token={token} onBack={() => setShowChangePin(false)} />;
  }
  const title = status === 'NONE' ? 'Choose a Subscription Plan' : 'Renew Your Subscription';
  const message =
    status === 'NONE'
      ? 'Select a plan to start using Quick Books features.'
      : 'Your subscription has expired. Renew to regain access.';

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{message}</Text>
        <Text style={styles.hint}>Plan selection will be implemented in the next phase.</Text>
        <View style={styles.actions}>
          <Button title="Change Login PIN" onPress={() => setShowChangePin(true)} variant="secondary" />
          <Button title="Sign Out" onPress={onLogout} variant="secondary" />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
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
  },
  hint: {
    color: colors.warning,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
});
