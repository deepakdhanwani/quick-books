import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { api, TeamUser } from '../services/api';
type TeamUsersScreenProps = {
  token: string;
  onAddUser: () => void;
  onOpenUser: (id: number) => void;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function TeamUsersScreen({
  token,
  onAddUser,
  onOpenUser,
  refreshing,
  onRefresh,
}: TeamUsersScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setError('');
    try {
      const response = await api.listTeamUsers(token);
      setUsers(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load team users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleRefresh = async () => {
    await onRefresh();
    await loadUsers();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Staff sign in with your business mobile number and their assigned PIN.
        </Text>
        <Pressable style={styles.addButton} onPress={onAddUser}>
          <Ionicons name="person-add-outline" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add User</Text>
        </Pressable>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={undefined}
          ListHeaderComponent={
            error ? <Text style={styles.error}>{error}</Text> : null
          }
          ListEmptyComponent={
            <Card>
              <Text style={styles.emptyTitle}>No team users yet</Text>
              <Text style={styles.emptyHint}>Create a user and assign a PIN for staff access.</Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpenUser(item.id)}>
              <Card style={styles.userCard}>
                <View style={styles.userRow}>
                  <View style={[styles.avatar, !item.active && styles.avatarInactive]}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userMeta}>PIN: {item.loginPin}</Text>
                    <Text style={[styles.userStatus, item.active ? styles.active : styles.inactive]}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </View>
              </Card>
            </Pressable>
          )}
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
        />
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 8, gap: 12 },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13), lineHeight: theme.scaleFont(18) },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addButtonText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: theme.scaleFont(14) },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 20, paddingTop: 8, gap: 10 },
  userCard: { marginBottom: 0 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: { backgroundColor: 'rgba(148, 163, 184, 0.15)' },
  avatarText: { color: theme.colors.primary, fontWeight: '700', fontSize: theme.scaleFont(16) },
  userInfo: { flex: 1 },
  userName: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600' },
  userMeta: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12), marginTop: 2 },
  userStatus: { fontSize: theme.scaleFont(12), marginTop: 4, fontWeight: '600' },
  active: { color: theme.colors.success },
  inactive: { color: theme.colors.warning },
  error: { color: theme.colors.error, marginBottom: 12 },
  emptyTitle: { color: theme.colors.text, fontWeight: '700', fontSize: theme.scaleFont(15) },
  emptyHint: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13), marginTop: 6 },

  };
}
