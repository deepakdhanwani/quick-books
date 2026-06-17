import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { TeamUserPermissionsEditor } from '../components/TeamUserPermissionsEditor';
import { api, CompanyOption } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { generateLoginPin } from '../utils/pinGenerator';
import { DEFAULT_NEW_STAFF_PERMISSIONS } from '../utils/staffPermissions';

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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [name, setName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_NEW_STAFF_PERMISSIONS);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api.listCompanies(token).then(setCompanies).catch(() => setCompanies([]));
  }, [token]);

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
    if (permissions.companyIds.length === 0) {
      setError('Select at least one company');
      return;
    }

    setSaving(true);
    try {
      const created = await api.createTeamUser(token, {
        name: name.trim(),
        loginPin,
        permissions,
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
          Assign a PIN and choose company access plus module permissions for this team member.
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
          <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.generateButtonText}>Auto Generate PIN</Text>
        </Pressable>
      </Card>

      <Card>
        <TeamUserPermissionsEditor
          companies={companies}
          value={permissions}
          onChange={setPermissions}
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Create User" onPress={handleSave} loading={saving} />
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: { flex: 1 },
    content: { padding: 20, gap: 16 },
    hint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(18),
      marginBottom: 16,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 4,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    generateButtonText: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(14),
      fontWeight: '600',
    },
    error: { color: theme.colors.error },
  };
}
