import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { StatCard } from '../components/StatCard';
import { SubscriberAccountProfile } from '../services/api';
import { colors } from '../theme/colors';

type DashboardScreenProps = {
  profile: SubscriberAccountProfile | null;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

const QUICK_ACTIONS = [
  { label: 'New Sale', icon: 'add-circle-outline' as const },
  { label: 'New Purchase', icon: 'bag-add-outline' as const },
  { label: 'Add Customer', icon: 'person-add-outline' as const },
];

export function DashboardScreen({ profile, refreshing, onRefresh }: DashboardScreenProps) {
  const greetingName = profile?.ownerName?.split(' ')[0] ?? 'there';
  const subscriptionLabel =
    profile?.subscriptionStatus === 'ACTIVE'
      ? 'Active plan'
      : profile?.subscriptionStatus === 'EXPIRED'
        ? 'Plan expired'
        : 'No subscription';

  const subscriptionColor =
    profile?.subscriptionStatus === 'ACTIVE'
      ? colors.success
      : profile?.subscriptionStatus === 'EXPIRED'
        ? colors.error
        : colors.warning;

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.hero}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{greetingName}</Text>
          <Text style={styles.business}>{profile?.businessName ?? 'Your business'}</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: `${subscriptionColor}55` }]}>
          <View style={[styles.statusDot, { backgroundColor: subscriptionColor }]} />
          <Text style={[styles.statusText, { color: subscriptionColor }]}>{subscriptionLabel}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Today's Sales" value="₹0" icon="trending-up-outline" accent={colors.success} />
        <View style={styles.statGap} />
        <StatCard label="Purchases" value="₹0" icon="bag-handle-outline" accent={colors.primary} />
        <View style={styles.statGap} />
        <StatCard label="Pending" value="₹0" icon="time-outline" accent={colors.warning} />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable key={action.label} style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <Card>
        <View style={styles.overviewRow}>
          <OverviewItem icon="people-outline" label="Customers" value="0" />
          <OverviewItem icon="storefront-outline" label="Vendors" value="0" />
          <OverviewItem icon="receipt-outline" label="Invoices" value="0" />
        </View>
      </Card>

      <Card style={styles.tipCard}>
        <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        <View style={styles.tipText}>
          <Text style={styles.tipTitle}>Getting started</Text>
          <Text style={styles.tipBody}>
            Use the menu to explore modules. Manage your account and subscription anytime from Settings.
          </Text>
        </View>
      </Card>
    </RefreshableScrollView>
  );
}

function OverviewItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.overviewItem}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  business: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statGap: {
    width: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  overviewLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
