import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import {
  api,
  SubscriberSubscriptionInfo,
  SubscriptionPlanOption,
} from '../services/api';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate, getPlanDurationLabel } from '../utils/planDuration';

type SubscriptionScreenProps = {
  token: string;
  status: 'NONE' | 'ACTIVE' | 'EXPIRED';
  locked?: boolean;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onSubscribed?: () => void | Promise<void>;
};

export function SubscriptionScreen({
  token,
  status,
  locked = false,
  refreshing,
  onRefresh,
  onSubscribed,
}: SubscriptionScreenProps) {
  const [plans, setPlans] = useState<SubscriptionPlanOption[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriberSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadPlans = useCallback(async () => {
    setError('');
    try {
      const [planList, current] = await Promise.all([
        api.listSubscriptionPlans(token),
        api.getCurrentSubscription(token),
      ]);
      setPlans(planList);
      setCurrentSubscription(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load subscription plans');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleRefresh = async () => {
    await onRefresh();
    await loadPlans();
  };

  const handleSubscribe = (plan: SubscriptionPlanOption) => {
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plan.name} for ${formatCurrency(plan.totalAmount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setSubscribingPlanId(plan.id);
            setError('');
            try {
              const response = await api.subscribeToPlan(token, plan.id);
              setCurrentSubscription(response.subscription);
              await onSubscribed?.();
              Alert.alert(
                'Subscription Active',
                `Your plan is active until ${formatDate(response.subscription.endDate)}.`,
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not subscribe to plan');
            } finally {
              setSubscribingPlanId(null);
            }
          },
        },
      ],
    );
  };

  const title =
    status === 'ACTIVE'
      ? 'Your Membership Plan'
      : status === 'EXPIRED'
        ? 'Renew Your Membership'
        : 'Choose a Membership Plan';

  const message =
    status === 'ACTIVE'
      ? 'Your subscription is active. Next renewal date is shown below.'
      : status === 'EXPIRED'
        ? 'Your membership has expired. Select a plan to continue using Quick Books.'
        : locked
          ? 'A membership plan is required before you can use any feature in the app.'
          : 'Browse available plans and choose the one that fits your business.';

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
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
      <Card style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="card-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </Card>

      {status === 'ACTIVE' && currentSubscription ? (
        <Card style={styles.currentCard}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <DetailRow label="Plan" value={currentSubscription.planName} />
          <DetailRow
            label="Duration"
            value={getPlanDurationLabel(currentSubscription.planDuration)}
          />
          <DetailRow label="Started On" value={formatDate(currentSubscription.startDate)} />
          <DetailRow
            label="Next Renewal Date"
            value={formatDate(currentSubscription.endDate)}
            highlight
          />
          <DetailRow label="Amount Paid" value={formatCurrency(currentSubscription.totalAmount)} />
        </Card>
      ) : null}

      {status !== 'ACTIVE' ? (
        <>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {plans.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No membership plans are available right now.</Text>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.planTitleBlock}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>{getPlanDurationLabel(plan.duration)}</Text>
                  </View>
                  <Text style={styles.planPrice}>{formatCurrency(plan.totalAmount)}</Text>
                </View>

                {plan.description ? (
                  <Text style={styles.planDescription}>{plan.description}</Text>
                ) : null}

                <View style={styles.breakdown}>
                  <BreakdownRow label="Base Price" value={formatCurrency(plan.price)} />
                  {plan.discountAmount > 0 ? (
                    <BreakdownRow
                      label={plan.discountName ? `Discount (${plan.discountName})` : 'Discount'}
                      value={`-${formatCurrency(plan.discountAmount)}`}
                      valueColor={colors.success}
                    />
                  ) : null}
                  {plan.taxAmount > 0 ? (
                    <BreakdownRow label="Tax" value={formatCurrency(plan.taxAmount)} />
                  ) : null}
                  <BreakdownRow label="Total" value={formatCurrency(plan.totalAmount)} bold />
                </View>

                <Button
                  title={status === 'EXPIRED' ? 'Renew Plan' : 'Choose Plan'}
                  onPress={() => handleSubscribe(plan)}
                  loading={subscribingPlanId === plan.id}
                />
              </Card>
            ))
          )}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RefreshableScrollView>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</Text>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  valueColor,
  bold = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, bold && styles.breakdownBold]}>{label}</Text>
      <Text
        style={[
          styles.breakdownValue,
          bold && styles.breakdownBold,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  currentCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  detailValueHighlight: {
    color: colors.primary,
    fontSize: 15,
  },
  planCard: {
    marginBottom: 14,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  planTitleBlock: {
    flex: 1,
  },
  planName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  planDuration: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  planPrice: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  planDescription: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  breakdown: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  breakdownValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownBold: {
    color: colors.text,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
});
