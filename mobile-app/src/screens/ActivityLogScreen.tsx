import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { api, AuditLogEntry } from '../services/api';
import { colors } from '../theme/colors';

type ActivityLogScreenProps = {
  token: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

function formatAction(action: AuditLogEntry['action']) {
  if (action === 'CREATE') return 'Created';
  if (action === 'UPDATE') return 'Updated';
  return 'Deleted';
}

function formatEntityType(entityType: string) {
  return entityType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ActivityLogScreen({ token, refreshing, onRefresh }: ActivityLogScreenProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setError('');
    try {
      const response = await api.listAuditLogs(token, 0, 50);
      setLogs(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load activity log');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleRefresh = async () => {
    await onRefresh();
    await loadLogs();
  };

  if (loading && logs.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={logs}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={() => void handleRefresh()}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={
        <Card>
          <Text style={styles.empty}>No activity recorded yet.</Text>
        </Card>
      }
      renderItem={({ item }) => (
        <Card style={styles.logCard}>
          <Text style={styles.logTitle}>
            {formatAction(item.action)} {formatEntityType(item.entityType)}
          </Text>
          {item.details ? <Text style={styles.logDetails}>{item.details}</Text> : null}
          <Text style={styles.logMeta}>
            {item.actorName} · PIN {item.actorPin}
          </Text>
          <Text style={styles.logTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 10 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logCard: { marginBottom: 0 },
  logTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  logDetails: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  logMeta: { color: colors.primary, fontSize: 12, marginTop: 8, fontWeight: '600' },
  logTime: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  error: { color: colors.error, marginBottom: 12 },
  empty: { color: colors.textSecondary, fontSize: 14 },
});
