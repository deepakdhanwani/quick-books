import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { SubscriberAccountProfile } from '../services/api';
import { colors } from '../theme/colors';

type AccountScreenProps = {
  profile: SubscriberAccountProfile | null;
  loading: boolean;
  error: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onChangePin: () => void;
  onSubscription: () => void;
};

function formatSubscriptionStatus(status?: SubscriberAccountProfile['subscriptionStatus']) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'EXPIRED') return 'Expired';
  return 'No plan';
}

function statusColor(status?: SubscriberAccountProfile['subscriptionStatus']) {
  if (status === 'ACTIVE') return colors.success;
  if (status === 'EXPIRED') return colors.error;
  return colors.warning;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function AccountScreen({
  profile,
  loading,
  error,
  refreshing,
  onRefresh,
  onChangePin,
  onSubscription,
}: AccountScreenProps) {
  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading && !profile ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <DetailRow label="Business" value={profile?.businessName ?? '—'} />
        <DetailRow label="Owner" value={profile?.ownerName ?? '—'} />
        <DetailRow label="Mobile" value={profile?.phone ?? '—'} />
        <DetailRow label="Business Type" value={profile?.businessTypeName ?? '—'} />
        <DetailRow label="Member Since" value={formatDate(profile?.createdAt)} />
        <DetailRow
          label="Subscription"
          value={formatSubscriptionStatus(profile?.subscriptionStatus)}
          valueColor={statusColor(profile?.subscriptionStatus)}
        />
        {profile?.currentSubscription ? (
          <>
            <DetailRow label="Current Plan" value={profile.currentSubscription.planName} />
            <DetailRow
              label="Valid Until"
              value={formatDate(profile.currentSubscription.endDate)}
            />
          </>
        ) : null}
      </Card>

      <Text style={styles.actionsTitle}>Account Actions</Text>

      <Pressable style={styles.actionRow} onPress={onChangePin}>
        <View style={styles.actionIcon}>
          <Ionicons name="key-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>Change Login PIN</Text>
          <Text style={styles.actionHint}>Update your secure sign-in PIN</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <Pressable style={styles.actionRow} onPress={onSubscription}>
        <View style={styles.actionIcon}>
          <Ionicons name="card-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>Subscription Plans</Text>
          <Text style={styles.actionHint}>View or manage your subscription</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>
        </>
      )}
    </RefreshableScrollView>
  );
}

function DetailRow({
  label,
  value,
  valueColor = colors.text,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  actionsTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  actionHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
});
