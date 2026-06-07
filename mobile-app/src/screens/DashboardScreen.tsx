import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { StatCard } from '../components/StatCard';
import { api, BusinessIntelligence, SubscriberAccountProfile, SubscriberDashboard } from '../services/api';
import { formatCurrency } from '../utils/saleAmounts';

type DashboardScreenProps = {
  token: string;
  profile: SubscriberAccountProfile | null;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onNewSale?: () => void;
  onNewPurchase?: () => void;
  onAddCustomer?: () => void;
  onOpenReports?: () => void;
};

const QUICK_ACTIONS = [
  { key: 'sale', label: 'New Sale', icon: 'add-circle-outline' as const },
  { key: 'purchase', label: 'New Purchase', icon: 'bag-add-outline' as const },
  { key: 'customer', label: 'Add Customer', icon: 'person-add-outline' as const },
];

export function DashboardScreen({
  token,
  profile,
  refreshing,
  onRefresh,
  onNewSale,
  onNewPurchase,
  onAddCustomer,
  onOpenReports,
}: DashboardScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [dashboard, setDashboard] = useState<SubscriberDashboard | null>(null);
  const [intelligence, setIntelligence] = useState<BusinessIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [dash, intel] = await Promise.all([
        api.getDashboard(token),
        api.getIntelligence(token).catch(() => null),
      ]);
      setDashboard(dash);
      setIntelligence(intel);
    } catch {
      setDashboard(null);
      setIntelligence(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = async () => {
    await onRefresh();
    await loadDashboard();
  };

  const greetingName = profile?.ownerName?.split(' ')[0] ?? 'there';
  const subscriptionLabel =
    profile?.subscriptionStatus === 'ACTIVE'
      ? 'Active plan'
      : profile?.subscriptionStatus === 'EXPIRED'
        ? 'Plan expired'
        : 'No subscription';

  const subscriptionColor =
    profile?.subscriptionStatus === 'ACTIVE'
      ? theme.colors.success
      : profile?.subscriptionStatus === 'EXPIRED'
        ? theme.colors.error
        : theme.colors.warning;

  const pendingTotal =
    (dashboard?.pendingReceivables ?? 0) + (dashboard?.pendingPayables ?? 0);

  const handleQuickAction = (key: string) => {
    if (key === 'sale') {
      onNewSale?.();
    } else if (key === 'purchase') {
      onNewPurchase?.();
    } else if (key === 'customer') {
      onAddCustomer?.();
    }
  };

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
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

      {loading && !dashboard ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              label="Today's Sales"
              value={formatCurrency(dashboard?.todaySales ?? 0)}
              icon="trending-up-outline"
              accent={theme.colors.success}
            />
            <View style={styles.statGap} />
            <StatCard
              label="Today's Purchases"
              value={formatCurrency(dashboard?.todayPurchases ?? 0)}
              icon="bag-handle-outline"
              accent={theme.colors.primary}
            />
            <View style={styles.statGap} />
            <StatCard
              label="Outstanding"
              value={formatCurrency(pendingTotal)}
              icon="time-outline"
              accent={theme.colors.warning}
            />
          </View>

          <Text style={styles.sectionTitle}>This Month</Text>
          <Card>
            <View style={styles.monthRow}>
              <MonthMetric label="Sales" value={formatCurrency(dashboard?.monthSales ?? 0)} />
              <MonthMetric label="Purchases" value={formatCurrency(dashboard?.monthPurchases ?? 0)} />
              <MonthMetric
                label="Net Position"
                value={formatCurrency(dashboard?.monthNetPosition ?? 0)}
                highlight={
                  (dashboard?.monthNetPosition ?? 0) >= 0 ? theme.colors.success : theme.colors.error
                }
              />
            </View>
          </Card>

          {intelligence ? (
            <Card style={styles.forecastCard}>
              <View style={styles.forecastHeader}>
                <Text style={styles.forecastTitle}>Month-end Forecast</Text>
                <View style={[styles.healthPill, { backgroundColor: `${theme.colors.primary}18` }]}>
                  <Text style={[styles.healthPillText, { color: theme.colors.primary }]}>
                    Pulse {intelligence.healthScore}
                  </Text>
                </View>
              </View>
              <Text style={styles.forecastValue}>
                {formatCurrency(
                  intelligence.forecasts.find((item) => item.key === 'SALES_MONTH')?.projectedValue ?? 0,
                )}
              </Text>
              <Text style={styles.forecastHint}>
                {intelligence.insights[0]?.message ??
                  'Projected sales at current daily pace. Open Reports for full forecasts and actions.'}
              </Text>
            </Card>
          ) : null}
        </>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable key={action.key} style={styles.actionCard} onPress={() => handleQuickAction(action.key)}>
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <Card>
        <View style={styles.overviewRow}>
          <OverviewItem icon="people-outline" label="Customers" value={String(dashboard?.customerCount ?? 0)} />
          <OverviewItem icon="storefront-outline" label="Vendors" value={String(dashboard?.vendorCount ?? 0)} />
          <OverviewItem icon="cube-outline" label="Products" value={String(dashboard?.productCount ?? 0)} />
        </View>
        <View style={[styles.overviewRow, styles.overviewRowSecond]}>
          <OverviewItem icon="receipt-outline" label="Sales" value={String(dashboard?.saleCount ?? 0)} />
          <OverviewItem icon="document-text-outline" label="Purchases" value={String(dashboard?.purchaseCount ?? 0)} />
          <OverviewItem
            icon="wallet-outline"
            label="Receivable"
            value={formatCurrency(dashboard?.pendingReceivables ?? 0)}
          />
        </View>
      </Card>

      <Pressable style={styles.reportsCard} onPress={onOpenReports}>
        <View style={styles.reportsIcon}>
          <Ionicons name="bar-chart-outline" size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.reportsText}>
          <Text style={styles.reportsTitle}>Business Intelligence</Text>
          <Text style={styles.reportsBody}>
            Forecasts, cash outlook, health score, and recommended actions for what to do next.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </Pressable>
    </RefreshableScrollView>
  );
}

function MonthMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.monthMetric}>
      <Text style={styles.monthLabel}>{label}</Text>
      <Text style={[styles.monthValue, highlight ? { color: highlight } : null]}>{value}</Text>
    </View>
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.overviewItem}>
      <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    hero: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 20,
      gap: 12,
    },
    greeting: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
    },
    name: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(28),
      fontWeight: '700' as const,
      marginTop: 4,
    },
    business: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
      marginTop: 4,
    },
    statusPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: theme.colors.surface,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    loadingBox: {
      paddingVertical: 24,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row' as const,
      marginBottom: 20,
    },
    statGap: {
      width: 10,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 12,
    },
    monthRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    monthMetric: {
      flex: 1,
      alignItems: 'center' as const,
    },
    monthLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      marginBottom: 4,
    },
    monthValue: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
    },
    forecastCard: {
      marginTop: 12,
      gap: 8,
    },
    forecastHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    forecastTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
    healthPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    healthPillText: {
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
    },
    forecastValue: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(24),
      fontWeight: '800' as const,
    },
    forecastHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
    },
    actionsGrid: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 24,
    },
    actionCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      alignItems: 'center' as const,
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}1F`,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 8,
    },
    actionLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
    overviewRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    overviewRowSecond: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    overviewItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    overviewValue: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(18),
      fontWeight: '700' as const,
      marginTop: 8,
    },
    overviewLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      marginTop: 4,
      textAlign: 'center' as const,
    },
    reportsCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}44`,
      backgroundColor: `${theme.colors.primary}12`,
    },
    reportsIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}22`,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    reportsText: {
      flex: 1,
    },
    reportsTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
      marginBottom: 4,
    },
    reportsBody: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
    },
  };
}
