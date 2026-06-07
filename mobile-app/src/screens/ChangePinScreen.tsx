import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { Input } from '../components/Input';
import { api } from '../services/api';
import { colors } from '../theme/colors';

type ChangePinScreenProps = {
  token: string;
  onBack: () => void;
  embedded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
};

export function ChangePinScreen({
  token,
  onBack,
  embedded,
  refreshing = false,
  onRefresh = async () => {},
}: ChangePinScreenProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.changePin(token, { currentPin, newPin, confirmNewPin });
      setSuccess('Your login PIN has been updated.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {embedded ? null : <Text style={styles.title}>Change Login PIN</Text>}
      <Card>
        <Text style={styles.hint}>
          Your login PIN works like a password. Choose a new 6 to 8 digit PIN that only you know.
        </Text>
        <Input
          label="Current PIN"
          value={currentPin}
          onChangeText={setCurrentPin}
          secureTextEntry
          enableVisibilityToggle
          keyboardType="number-pad"
        />
        <Input
          label="New PIN"
          value={newPin}
          onChangeText={setNewPin}
          secureTextEntry
          enableVisibilityToggle
          keyboardType="number-pad"
        />
        <Input
          label="Confirm New PIN"
          value={confirmNewPin}
          onChangeText={setConfirmNewPin}
          secureTextEntry
          enableVisibilityToggle
          keyboardType="number-pad"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <View style={styles.actions}>
          <Button title="Update PIN" onPress={handleSubmit} loading={loading} />
          {embedded ? null : <Button title="Back" onPress={onBack} variant="secondary" />}
        </View>
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: 24 },
  hint: { color: colors.textSecondary, marginBottom: 16, lineHeight: 22 },
  actions: { gap: 12, marginTop: 8 },
  error: { color: colors.error, marginBottom: 12 },
  success: { color: colors.success, marginBottom: 12 },
});
