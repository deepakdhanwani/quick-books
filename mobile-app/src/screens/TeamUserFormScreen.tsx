import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api } from '../services/api';
import { colors } from '../theme/colors';
import { appAlert } from '../utils/appAlert';
import { generateLoginPin } from '../utils/pinGenerator';

type TeamUserFormScreenProps = {
  token: string;
  onSaved: () => void;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function TeamUserFormScreen({
  token,
  onSaved,
  refreshing,
  onRefresh,
}: TeamUserFormScreenProps) {
  const [name, setName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePin = () => {
    setLoginPin(generateLoginPin());
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!/^[0-9]{6,8}$/.test(loginPin)) {
      setError('PIN must be 6 to 8 digits');
      return;
    }

    setSaving(true);
    try {
      const created = await api.createTeamUser(token, {
        name: name.trim(),
        loginPin,
      });
      await appAlert(
        'User created',
        `${created.name} can sign in with your business mobile number and PIN ${created.loginPin}.`,
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <Text style={styles.hint}>
          This user will sign in using your business mobile number and the PIN you assign. Enter a
          PIN yourself or auto-generate one — you can edit it before saving.
        </Text>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Staff member name" />
        <Input
          label="Login PIN"
          value={loginPin}
          onChangeText={setLoginPin}
          placeholder="6 to 8 digits"
          keyboardType="number-pad"
          maxLength={8}
        />
        <Pressable style={styles.generateButton} onPress={handleGeneratePin}>
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          <Text style={styles.generateButtonText}>Auto Generate PIN</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Create User" onPress={handleSave} loading={saving} />
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  hint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  generateButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  error: { color: colors.error, marginBottom: 12 },
});
