import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';

const STATS = [
  { label: 'Total Subscribers', value: '—', hint: 'Connect reports API' },
  { label: 'Active Subscriptions', value: '—', hint: 'Connect reports API' },
  { label: 'Revenue (MTD)', value: '—', hint: 'Connect reports API' },
  { label: 'Expiring Soon', value: '—', hint: 'Connect reports API' },
];

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to Quick Books Admin</Text>
      <Text style={styles.subtitle}>Platform overview and quick stats</Text>

      <View style={styles.grid}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.gridItem}>
            <Card>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statHint}>{stat.hint}</Text>
            </Card>
          </View>
        ))}
      </View>
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
