import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { api, AdminDashboardSummary } from '../services/api';
import { colors } from '../theme/colors';

type DashboardScreenProps = {
  token: string;
};

export function DashboardScreen({ token }: DashboardScreenProps) {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getDashboardSummary(token);
        if (!cancelled) {
          setSummary(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard summary');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const stats = summary
    ? [
        { label: 'Total Subscribers', value: String(summary.totalSubscribers), hint: 'Active subscriber accounts' },
        { label: 'Active Subscriptions', value: String(summary.activeSubscriptions), hint: 'Currently active plans' },
        {
          label: 'Revenue (MTD)',
          value: `₹${summary.revenueMtd.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          hint: 'Subscription revenue this month',
        },
        { label: 'Expiring Soon', value: String(summary.expiringSoon), hint: 'Within the next 30 days' },
        { label: 'Pending Subscriptions', value: String(summary.pendingSubscriptions), hint: 'Awaiting first plan' },
      ]
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to Quick Books Admin</Text>
      <Text style={styles.subtitle}>Platform overview and quick stats</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.grid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.gridItem}>
              <Card>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statHint}>{stat.hint}</Text>
              </Card>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  welcome: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 24,
  },
  error: {
    color: colors.error,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    width: '100%',
  },
  gridItem: {
    width: '25%',
    minWidth: 220,
    padding: 8,
    flexGrow: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
