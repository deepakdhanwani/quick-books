import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { TeamUserPermissionsEditor } from '../components/TeamUserPermissionsEditor';
import { api, CompanyOption, TeamUser } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { DEFAULT_NEW_STAFF_PERMISSIONS } from '../utils/staffPermissions';

type TeamUserDetailScreenProps = {
  token: string;
  userId: number;
  onDeleted: () => void;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function TeamUserDetailScreen({
  token,
  userId,
  onDeleted,
  refreshing,
  onRefresh,
}: TeamUserDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [user, setUser] = useState<TeamUser | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_NEW_STAFF_PERMISSIONS);
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    setError('');
    try {
      const [response, companyList] = await Promise.all([
        api.getTeamUser(token, userId),
        api.listCompanies(token),
      ]);
      setUser(response);
      setName(response.name);
      setPermissions(response.permissions);
      setCompanies(companyList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load user');
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const handleRefresh = async () => {
    await onRefresh();
    await loadUser();
  };

  const handleSave = async () => {
    if (!user) return;
    if (permissions.companyIds.length === 0) {
      setError('Select at least one company');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateTeamUser(token, userId, {
        name: name.trim(),
        active: user.active,
        permissions,
      });
      setUser(updated);
      setPermissions(updated.permissions);
      await appAlert('Saved', 'User access updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updateTeamUser(token, userId, {
        name: user.name,
        active: !user.active,
        permissions: user.permissions,
      });
      setUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPin = async () => {
    if (!/^[0-9]{6,8}$/.test(newPin)) {
      setError('PIN must be 6 to 8 digits');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.setTeamUserPin(token, userId, newPin);
      setUser(updated);
      setNewPin('');
      await appAlert('PIN updated', `${updated.name} can now sign in with PIN ${updated.loginPin}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign PIN');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.resetTeamUserPin(token, userId);
      setUser(updated);
      await appAlert('PIN reset', `${updated.name}'s new PIN is ${updated.loginPin}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset PIN');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await appAlert('Delete user?', `Remove ${user?.name ?? 'this user'} from your team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTeamUser(token, userId);
            onDeleted();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete user');
          }
        },
      },
    ]);
  };

  if (loading && !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Text style={styles.sectionTitle}>User Details</Text>
        <Input label="Name" value={name} onChangeText={setName} />
        <View style={styles.pinRow}>
          <Text style={styles.pinLabel}>Current PIN</Text>
          <Text style={styles.pinValue}>{user?.loginPin ?? '—'}</Text>
        </View>
      </Card>

      <Card>
        <TeamUserPermissionsEditor
          companies={companies}
          value={permissions}
          onChange={setPermissions}
        />
        <Button title="Save Access" onPress={handleSave} loading={saving} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Assign New PIN</Text>
        <Input
          label="New PIN"
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          placeholder="6 to 8 digits"
        />
        <Button title="Assign PIN" onPress={handleAssignPin} loading={saving} variant="secondary" />
        <Button title="Generate Random PIN" onPress={handleResetPin} loading={saving} variant="secondary" />
      </Card>

      <Card>
        <Pressable style={styles.toggleRow} onPress={handleToggleActive}>
          <Text style={styles.toggleLabel}>{user?.active ? 'Deactivate User' : 'Activate User'}</Text>
          <Ionicons
            name={user?.active ? 'pause-circle-outline' : 'play-circle-outline'}
            size={22}
            color={theme.colors.primary}
          />
        </Pressable>
      </Card>

      <Button title="Delete User" onPress={handleDelete} variant="secondary" />
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: { flex: 1 },
    content: { padding: 20, gap: 16 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: {
      color: theme.colors.text,
      fontWeight: '700',
      fontSize: theme.scaleFont(15),
      marginBottom: 12,
    },
    pinRow: { marginBottom: 8 },
    pinLabel: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12), marginBottom: 4 },
    pinValue: { color: theme.colors.text, fontSize: theme.scaleFont(16), fontWeight: '600' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleLabel: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600' },
    error: { color: theme.colors.error, marginBottom: 8 },
  };
}
