import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { TrendChart } from '../components/bi/TrendChart';
import { CashPositionCard } from '../components/dashboard/CashPositionCard';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardInsightPreview } from '../components/dashboard/DashboardInsightPreview';
import { DashboardPulseStrip } from '../components/dashboard/DashboardPulseStrip';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { DashboardRemindersCard } from '../components/dashboard/DashboardRemindersCard';
import { DashboardTodayCards } from '../components/dashboard/DashboardTodayCards';
import { MonthPerformanceCard } from '../components/dashboard/MonthPerformanceCard';
import { WorkspaceTiles } from '../components/dashboard/WorkspaceTiles';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { SnoozeReminderModal } from '../components/SnoozeReminderModal';
import type { DrawerRoute } from '../navigation/types';
import { api, BusinessIntelligence, PaymentReminder, SubscriberAccountProfile, SubscriberDashboard } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { formatCurrency } from '../utils/saleAmounts';

type DashboardScreenProps = {
  token: string;
  activeCompanyId?: number;
  profile: SubscriberAccountProfile | null;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onNewSale?: () => void;
  onNewPurchase?: () => void;
  onAddCustomer?: () => void;
  onOpenReports?: () => void;
  onNavigate?: (route: DrawerRoute) => void;
  onOpenReminders?: () => void;
  onCreateReminder?: () => void;
  onSnoozeReminder?: (reminderId: number, snoozedUntil: string) => void | Promise<void>;
  onCompleteReminder?: (reminderId: number) => void | Promise<void>;
};

export function DashboardScreen({
  token,
  activeCompanyId,
  profile,
  refreshing,
  onRefresh,
  onNewSale,
  onNewPurchase,
  onAddCustomer,
  onOpenReports,
  onNavigate,
  onOpenReminders,
  onCreateReminder,
  onSnoozeReminder,
  onCompleteReminder,
}: DashboardScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [dashboard, setDashboard] = useState<SubscriberDashboard | null>(null);
  const [intelligence, setIntelligence] = useState<BusinessIntelligence | null>(null);
  const [dueReminders, setDueReminders] = useState<PaymentReminder[]>([]);
  const [snoozeTarget, setSnoozeTarget] = useState<PaymentReminder | null>(null);
  const [snoozing, setSnoozing] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadGenerationRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    try {
      const [dash, intel, reminders] = await Promise.all([
        api.getDashboard(token),
        api.getIntelligence(token).catch(() => null),
        api.getDuePaymentReminders(token).catch(() => []),
      ]);
      if (generation !== loadGenerationRef.current) {
        return;
      }
      setDashboard(dash);
      setIntelligence(intel);
      setDueReminders(reminders);
    } catch {
      if (generation !== loadGenerationRef.current) {
        return;
      }
      setDashboard(null);
      setIntelligence(null);
      setDueReminders([]);
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    setDashboard(null);
    setIntelligence(null);
    setDueReminders([]);
    void loadDashboard();
  }, [loadDashboard, activeCompanyId]);

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

  const salesForecast =
    intelligence?.forecasts.find((item) => item.key === 'SALES_MONTH') ?? null;

  const trendData = (intelligence?.salesTrend ?? []).slice(-7);
  const todayReminderCount = dueReminders.filter((item) => item.dueToday).length;

  const handleQuickAction = (key: string) => {
    if (key === 'sale') {
      onNewSale?.();
    } else if (key === 'purchase') {
      onNewPurchase?.();
    } else if (key === 'customer') {
      onAddCustomer?.();
    } else if (key === 'reports') {
      onOpenReports?.();
    } else if (key === 'reminder') {
      onCreateReminder?.();
    }
  };

  const handleSnoozeConfirm = async (snoozedUntil: string) => {
    if (!snoozeTarget || !onSnoozeReminder) {
      return;
    }

    setSnoozing(true);
    try {
      await onSnoozeReminder(snoozeTarget.id, snoozedUntil);
      setSnoozeTarget(null);
      void loadDashboard();
    } catch (err) {
      appAlert('Snooze failed', err instanceof Error ? err.message : 'Could not snooze reminder');
    } finally {
      setSnoozing(false);
    }
  };

  const handleCompleteReminder = async (reminder: PaymentReminder) => {
    if (!onCompleteReminder) {
      return;
    }

    try {
      await onCompleteReminder(reminder.id);
      void loadDashboard();
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not complete reminder');
    }
  };

  const workspaceTiles = [
    {
      route: 'customers' as const,
      label: 'Customers',
      value: String(dashboard?.customerCount ?? 0),
      icon: 'people-outline' as const,
    },
    {
      route: 'vendors' as const,
      label: 'Vendors',
      value: String(dashboard?.vendorCount ?? 0),
      icon: 'storefront-outline' as const,
    },
    {
      route: 'products' as const,
      label: 'Products',
      value: String(dashboard?.productCount ?? 0),
      icon: 'cube-outline' as const,
    },
    {
      route: 'sales' as const,
      label: 'Sales',
      value: String(dashboard?.saleCount ?? 0),
      icon: 'receipt-outline' as const,
    },
    {
      route: 'purchases' as const,
      label: 'Purchases',
      value: String(dashboard?.purchaseCount ?? 0),
      icon: 'document-text-outline' as const,
    },
  ];

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <DashboardHero
        greetingName={greetingName}
        businessName={profile?.businessName ?? 'Your business'}
        subscriptionLabel={subscriptionLabel}
        subscriptionColor={subscriptionColor}
        todayReminderCount={todayReminderCount}
        onOpenReminders={onOpenReminders}
      />

      {loading && !dashboard ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your business snapshot...</Text>
        </View>
      ) : (
        <>
          {intelligence ? (
            <DashboardPulseStrip
              score={intelligence.healthScore}
              label={intelligence.healthLabel}
              summary={intelligence.healthSummary}
              onPress={onOpenReports}
            />
          ) : null}

          <DashboardTodayCards
            todaySales={formatCurrency(dashboard?.todaySales ?? 0)}
            todayPurchases={formatCurrency(dashboard?.todayPurchases ?? 0)}
            outstanding={formatCurrency(pendingTotal)}
          />

          <DashboardRemindersCard
            reminders={dueReminders}
            onViewAll={onOpenReminders}
            onSnooze={setSnoozeTarget}
            onComplete={handleCompleteReminder}
          />

          <MonthPerformanceCard
            monthSales={dashboard?.monthSales ?? 0}
            monthPurchases={dashboard?.monthPurchases ?? 0}
            monthNetPosition={dashboard?.monthNetPosition ?? 0}
            salesForecast={salesForecast}
          />

          <CashPositionCard
            receivables={dashboard?.pendingReceivables ?? 0}
            payables={dashboard?.pendingPayables ?? 0}
            netOutlook={intelligence?.cashFlowOutlook.netOutlook}
            outlookSummary={intelligence?.cashFlowOutlook.summary}
          />

          {trendData.length > 0 ? (
            <TrendChart
              title="Sales Trend"
              data={trendData}
              emptyText="Record a few sales to see your trend"
            />
          ) : null}

          {intelligence ? (
            <DashboardInsightPreview insights={intelligence.insights} onViewAll={onOpenReports} />
          ) : null}
        </>
      )}

      <DashboardQuickActions onAction={handleQuickAction} />

      {onNavigate ? (
        <WorkspaceTiles tiles={workspaceTiles} onNavigate={onNavigate} />
      ) : null}

      <Pressable style={styles.reportsCard} onPress={onOpenReports}>
        <View style={styles.reportsIcon}>
          <Ionicons name="analytics-outline" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.reportsText}>
          <Text style={styles.reportsTitle}>Open Business Intelligence</Text>
          <Text style={styles.reportsBody}>
            Forecasts, customer and vendor trends, cash outlook, and actionable recommendations.
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={28} color={theme.colors.primary} />
      </Pressable>

      <SnoozeReminderModal
        visible={snoozeTarget != null}
        customerName={snoozeTarget?.customerName}
        onClose={() => setSnoozeTarget(null)}
        onConfirm={handleSnoozeConfirm}
        saving={snoozing}
      />
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 36,
    },
    loadingBox: {
      paddingVertical: 40,
      alignItems: 'center' as const,
      gap: 12,
      marginBottom: 16,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
    },
    reportsCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
      marginTop: 8,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}44`,
      backgroundColor: theme.colors.primarySurface,
    },
    reportsIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
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
