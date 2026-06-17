import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Autocomplete } from '../components/Autocomplete';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import {
  SUBSCRIBER_DATA_TABS,
  SubscriberDataPanel,
  SubscriberDataTab,
  SubscriberOverviewSummary,
} from '../components/SubscriberDataPanel';
import {
  api,
  AdminCompanySummary,
  BusinessType,
  SubscriberDataSummary,
  SubscriberDetail,
  SubscriberSubscriptionInfo,
} from '../services/api';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { formatPlanDuration } from '../utils/planDuration';
import { shareLoginDetails } from '../utils/shareLoginDetails';

type SubscriberDetailScreenProps = {
  token: string;
  subscriberId: number;
  initialPin?: string;
  onBack: () => void;
  onUpdated: () => void;
};

type PinConfirmAction = 'generate';

type Feedback = {
  type: 'success' | 'error';
  text: string;
};

export function SubscriberDetailScreen({
  token,
  subscriberId,
  initialPin,
  onBack,
  onUpdated,
}: SubscriberDetailScreenProps) {
  const [detail, setDetail] = useState<SubscriberDetail | null>(null);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pinFeedback, setPinFeedback] = useState<Feedback | null>(null);
  const [editFeedback, setEditFeedback] = useState<Feedback | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<Feedback | null>(null);
  const [sessionPin, setSessionPin] = useState('');
  const [pinRevealed, setPinRevealed] = useState(false);
  const [pinConfirmAction, setPinConfirmAction] = useState<PinConfirmAction | null>(null);
  const [editing, setEditing] = useState(false);

  const [editBusinessName, setEditBusinessName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBusinessTypeQuery, setEditBusinessTypeQuery] = useState('');
  const [editBusinessTypeId, setEditBusinessTypeId] = useState('');
  const [editActive, setEditActive] = useState('true');
  const [activeTab, setActiveTab] = useState<SubscriberDataTab>('OVERVIEW');
  const [dataSummary, setDataSummary] = useState<SubscriberDataSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [companies, setCompanies] = useState<AdminCompanySummary[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);

  useEffect(() => {
    if (initialPin) {
      setSessionPin(initialPin);
      setPinRevealed(true);
    }
  }, [initialPin]);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [subscriber, types] = await Promise.all([
        api.getSubscriber(token, subscriberId),
        api.getActiveBusinessTypes(token),
      ]);
      setDetail(subscriber);
      setBusinessTypes(types);
      if (subscriber.defaultCompanyId) {
        setActiveCompanyId(subscriber.defaultCompanyId);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load subscriber');
    } finally {
      setLoading(false);
    }
  }, [token, subscriberId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const loadCompanies = useCallback(async () => {
    try {
      const rows = await api.getSubscriberCompanies(token, subscriberId);
      setCompanies(rows);
      setActiveCompanyId((current) => {
        if (current != null && rows.some((company) => company.id === current)) {
          return current;
        }
        const defaultCompany = rows.find((company) => company.defaultCompany);
        return defaultCompany?.id ?? rows[0]?.id ?? null;
      });
    } catch {
      setCompanies([]);
    }
  }, [token, subscriberId]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const loadSummary = useCallback(async () => {
    if (activeCompanyId == null) {
      setDataSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const summary = await api.getSubscriberDataSummary(token, subscriberId, activeCompanyId);
      setDataSummary(summary);
    } catch {
      setDataSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [token, subscriberId, activeCompanyId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const companyOptions = companies.map((company) => ({
    label: company.defaultCompany ? `${company.name} (default)` : company.name,
    value: String(company.id),
  }));

  const activeCompany = companies.find((company) => company.id === activeCompanyId) ?? null;

  const businessTypeOptions = businessTypes.map((type) => ({
    label: type.name,
    value: String(type.id),
    description: type.description,
  }));

  const startEdit = () => {
    if (!detail) return;
    setEditBusinessName(detail.businessName);
    setEditOwnerName(detail.ownerName);
    setEditPhone(detail.phone);
    setEditBusinessTypeId(detail.businessTypeId ? String(detail.businessTypeId) : '');
    setEditBusinessTypeQuery(detail.businessTypeName ?? '');
    setEditActive(detail.active ? 'true' : 'false');
    setEditing(true);
    setPinConfirmAction(null);
    setEditFeedback(null);
    setPinFeedback(null);
    setProfileFeedback(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditFeedback(null);
  };

  const handleUpdate = async () => {
    if (!editBusinessTypeId) {
      setEditFeedback({ type: 'error', text: 'Please select a business type from the suggestions' });
      return;
    }

    setSaving(true);
    setEditFeedback(null);
    try {
      await api.updateSubscriber(token, subscriberId, {
        businessName: editBusinessName,
        ownerName: editOwnerName,
        phone: editPhone,
        businessTypeId: Number(editBusinessTypeId),
        active: editActive === 'true',
      });
      setProfileFeedback({ type: 'success', text: 'Subscriber updated successfully.' });
      setEditFeedback(null);
      setEditing(false);
      await loadDetail();
      onUpdated();
    } catch (err) {
      setEditFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update subscriber' });
    } finally {
      setSaving(false);
    }
  };

  const regeneratePin = async (): Promise<string | null> => {
    setSaving(true);
    setPinFeedback(null);
    try {
      const result = await api.resetSubscriberPin(token, subscriberId);
      const pin = result.loginPin?.trim() ?? '';
      if (!pin) {
        throw new Error('Server did not return the new PIN. Please try again.');
      }
      setSessionPin(pin);
      setPinRevealed(true);
      await loadDetail();
      onUpdated();
      return pin;
    } catch (err) {
      setPinFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reset PIN' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPinAction = async () => {
    const pin = await regeneratePin();
    if (pin) {
      setPinConfirmAction(null);
      setPinFeedback({
        type: 'success',
        text: 'New PIN saved to the database. Share it with the subscriber now — their previous PIN no longer works.',
      });
    }
  };

  const handleShare = async () => {
    if (!detail) return;

    const sharePin = sessionPin || detail.loginPin?.trim() || '';

    setPinFeedback(null);
    setSharing(true);
    try {
      const shareResult = await shareLoginDetails({
        businessName: detail.businessName,
        ownerName: detail.ownerName,
        phone: detail.phone,
        loginPin: sharePin || undefined,
      });
      const copied = shareResult === 'clipboard';
      setPinFeedback({
        type: 'success',
        text: sharePin
          ? copied
            ? 'Login details copied to clipboard.'
            : 'Login details shared.'
          : copied
            ? 'Login details copied. Mobile number included — reset the PIN to include login credentials.'
            : 'Login details shared. Mobile number included — reset the PIN to include login credentials.',
      });
    } catch (err) {
      setPinFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to share login details' });
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError || 'Subscriber not found'}</Text>
        <Button title="Back to List" onPress={onBack} variant="secondary" />
      </View>
    );
  }

  const pinBusy = saving || sharing;
  const effectivePin = sessionPin || detail.loginPin?.trim() || '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Button title="← Back to List" onPress={onBack} variant="secondary" />
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>{detail.businessName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{detail.businessName}</Text>
            <Text style={styles.heroSubtitle}>{detail.ownerName}</Text>
            <Text style={styles.heroPhone}>{detail.phone}</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          <Badge label={detail.active ? 'Account Active' : 'Account Inactive'} variant={detail.active ? 'success' : 'error'} />
          <Badge
            label={formatSubscriptionStatus(detail.subscriptionStatus)}
            variant={subscriptionBadgeVariant(detail.subscriptionStatus)}
          />
          {detail.businessTypeName ? <Badge label={detail.businessTypeName} variant="primary" /> : null}
        </View>
      </Card>

      {companies.length > 0 ? (
        <Card style={styles.companyCard}>
          <Select
            label="Company"
            value={activeCompanyId != null ? String(activeCompanyId) : ''}
            options={companyOptions}
            onChange={(value) => setActiveCompanyId(Number(value))}
          />
          {activeCompany ? (
            <Text style={styles.companyHint}>
              Viewing data for {activeCompany.name} [{activeCompany.alias}]
            </Text>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.tabs}>
        {SUBSCRIBER_DATA_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'OVERVIEW' ? (
        <SubscriberOverviewSummary
          summary={dataSummary}
          loading={summaryLoading}
          onNavigate={setActiveTab}
        />
      ) : (
        <SubscriberDataPanel
          token={token}
          subscriberId={subscriberId}
          companyId={activeCompanyId ?? undefined}
          tab={activeTab}
        />
      )}

      {activeTab === 'OVERVIEW' && editing ? (
        <Card style={styles.sectionCard}>
          <SectionHeader icon="✎" title="Edit Subscriber" />
          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Input label="Business Name" value={editBusinessName} onChangeText={setEditBusinessName} />
            </View>
            <View style={styles.formField}>
              <Input label="Owner Name" value={editOwnerName} onChangeText={setEditOwnerName} />
            </View>
            <View style={styles.formField}>
              <Input label="Mobile Number" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
            </View>
          </View>
          <View style={styles.formFullWidth}>
            <Autocomplete
              label="Business Type"
              value={editBusinessTypeQuery}
              selectedValue={editBusinessTypeId}
              options={businessTypeOptions}
              placeholder="Type to search business type..."
              onChangeText={setEditBusinessTypeQuery}
              onSelect={(option) => {
                setEditBusinessTypeId(option.value);
                setEditBusinessTypeQuery(option.label);
              }}
              onClearSelection={() => setEditBusinessTypeId('')}
            />
          </View>
          <Select
            label="Account Status"
            value={editActive}
            compact
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
            onChange={setEditActive}
          />
          <View style={styles.editActions}>
            <Button title="Save Changes" onPress={handleUpdate} loading={saving} />
            <Button title="Cancel" onPress={cancelEdit} variant="secondary" />
          </View>
          {editFeedback ? <InlineFeedback feedback={editFeedback} /> : null}
        </Card>
      ) : activeTab === 'OVERVIEW' ? (
        <Card style={styles.sectionCard}>
          <SectionHeader icon="👤" title="Profile" action={<Button title="Edit" onPress={startEdit} variant="secondary" />} />
          {profileFeedback ? <InlineFeedback feedback={profileFeedback} /> : null}
          <View style={styles.infoGrid}>
            <InfoTile label="Business Name" value={detail.businessName} />
            <InfoTile label="Owner Name" value={detail.ownerName} />
            <InfoTile label="Mobile Number" value={detail.phone} />
            <InfoTile label="Business Type" value={detail.businessTypeName ?? '—'} />
            <InfoTile label="Registered On" value={formatDateTime(detail.createdAt)} />
          </View>
        </Card>
      ) : null}

      {activeTab === 'OVERVIEW' ? (
      <Card style={styles.sectionCard}>
        <SectionHeader icon="🔐" title="Login & Security" />
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            The login PIN is stored in the database and always available here for admin use. Reset the PIN only if
            the subscriber forgot it or you need to issue new login credentials.
          </Text>
        </View>

        <View style={styles.pinStatusRow}>
          <Badge label={effectivePin ? 'PIN Stored' : 'PIN Unavailable'} variant={effectivePin ? 'success' : 'warning'} />
          <Text style={styles.pinStatusText}>
            {effectivePin
              ? 'Use Show to view the PIN anytime — it matches what the subscriber uses to sign in'
              : 'Restart the backend, then open this page again. If it still appears, use Reset PIN once.'}
          </Text>
        </View>

        {effectivePin ? (
          <View style={styles.pinDisplayCard}>
            <Text style={styles.pinDisplayLabel}>Login PIN</Text>
            <Text style={styles.pinDisplayValue}>{pinRevealed ? effectivePin : '••••••'}</Text>
            <View style={styles.pinDisplayActions}>
              <Button
                title={pinRevealed ? 'Hide' : 'Show'}
                onPress={() => setPinRevealed(!pinRevealed)}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        {pinConfirmAction ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Reset login PIN?</Text>
            <Text style={styles.confirmMessage}>
              This will invalidate the subscriber&apos;s current PIN immediately. Make sure you can inform them of
              the new PIN before they try to sign in again.
            </Text>
            <View style={styles.rowActions}>
              <Button title="Yes, Reset PIN" onPress={handleConfirmPinAction} loading={pinBusy} />
              <Button
                title="Cancel"
                onPress={() => setPinConfirmAction(null)}
                variant="secondary"
                disabled={pinBusy}
              />
            </View>
          </View>
        ) : (
          <View style={styles.rowActions}>
            <Button
              title="Reset PIN"
              onPress={() => {
                setPinFeedback(null);
                setPinConfirmAction('generate');
              }}
              variant="secondary"
              disabled={pinBusy}
            />
            <Button
              title="Share Login Details"
              onPress={handleShare}
              loading={sharing}
              disabled={saving}
            />
          </View>
        )}

        <Text style={styles.pinHelper}>
          Share includes the mobile number and login instructions{effectivePin ? ', including the PIN when shown above' : ''}.
        </Text>

        {pinFeedback ? <InlineFeedback feedback={pinFeedback} /> : null}
      </Card>
      ) : null}

      {activeTab === 'OVERVIEW' ? (
      <Card style={styles.sectionCard}>
        <SectionHeader icon="📋" title="Subscription" />
        <View style={styles.infoGrid}>
          <InfoTile
            label="Status"
            value={formatSubscriptionStatus(detail.subscriptionStatus)}
            valueColor={subscriptionColor(detail.subscriptionStatus)}
          />
        </View>

        {detail.subscriptionStatus === 'NONE' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>This subscriber has not chosen a subscription plan yet.</Text>
          </View>
        ) : detail.currentSubscription ? (
          <SubscriptionBlock subscription={detail.currentSubscription} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No subscription record found.</Text>
          </View>
        )}

        {detail.subscriptionHistory.length > 1 ? (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Previous Subscriptions</Text>
            {detail.subscriptionHistory.slice(1).map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <SubscriptionBlock subscription={record} compact />
              </View>
            ))}
          </View>
        ) : null}
      </Card>
      ) : null}
    </ScrollView>
  );
}

function InlineFeedback({ feedback }: { feedback: Feedback }) {
  return (
    <View
      style={[
        styles.inlineFeedback,
        feedback.type === 'success' ? styles.inlineSuccess : styles.inlineError,
      ]}
    >
      <Text style={feedback.type === 'success' ? styles.successText : styles.errorText}>{feedback.text}</Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

function InfoTile({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={[styles.infoTileValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function SubscriptionBlock({
  subscription,
  compact = false,
}: {
  subscription: SubscriberSubscriptionInfo;
  compact?: boolean;
}) {
  return (
    <View style={compact ? styles.historyBlock : styles.subscriptionBlock}>
      <View style={styles.infoGrid}>
        <InfoTile label="Plan" value={subscription.planName} />
        <InfoTile label="Duration" value={formatPlanDuration(subscription.planDuration)} />
        <InfoTile label="Plan Price" value={formatCurrency(subscription.planPrice)} />
        <InfoTile label="Period" value={`${formatDate(subscription.startDate)} – ${formatDate(subscription.endDate)}`} />
        <InfoTile label="Tax" value={formatCurrency(subscription.taxAmount)} />
        {subscription.discountName ? <InfoTile label="Discount" value={subscription.discountName} /> : null}
        <InfoTile label="Total Paid" value={formatCurrency(subscription.totalAmount)} />
        <InfoTile
          label="Record Status"
          value={subscription.recordStatus}
          valueColor={subscription.recordStatus === 'ACTIVE' ? colors.success : colors.error}
        />
      </View>
    </View>
  );
}

function formatSubscriptionStatus(status: SubscriberDetail['subscriptionStatus']) {
  if (status === 'NONE') return 'Not Subscribed';
  if (status === 'ACTIVE') return 'Subscribed';
  return 'Expired';
}

function subscriptionBadgeVariant(status: SubscriberDetail['subscriptionStatus']): 'success' | 'error' | 'warning' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'EXPIRED') return 'error';
  return 'warning';
}

function subscriptionColor(status: SubscriberDetail['subscriptionStatus']) {
  if (status === 'ACTIVE') return colors.success;
  if (status === 'EXPIRED') return colors.error;
  return colors.warning;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: { paddingBottom: 40, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  topBar: { marginBottom: 4 },
  heroCard: {
    borderColor: colors.primary + '55',
    backgroundColor: colors.surfaceElevated,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  heroInfo: { flex: 1 },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  heroSubtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 2 },
  heroPhone: { color: colors.text, fontSize: 15, marginTop: 6, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionCard: { marginTop: 0 },
  companyCard: {
    marginBottom: 16,
    gap: 8,
  },
  companyHint: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoTile: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 180,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTileLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoTileValue: { color: colors.text, fontSize: 15, fontWeight: '500' },
  infoBanner: {
    backgroundColor: colors.primary + '14',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  infoBannerText: { color: colors.textSecondary, lineHeight: 21, fontSize: 14 },
  pinDisplayCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success + '44',
  },
  pinDisplayLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pinDisplayValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
    marginBottom: 12,
  },
  pinDisplayActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pinStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  pinStatusText: { color: colors.textSecondary, fontSize: 14 },
  pinHelper: { color: colors.textSecondary, fontSize: 13, marginTop: 10, lineHeight: 19 },
  confirmBox: {
    backgroundColor: colors.warning + '14',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  confirmTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  confirmMessage: { color: colors.textSecondary, lineHeight: 21, marginBottom: 14, fontSize: 14 },
  rowActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  editActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 12 },
  inlineFeedback: {
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  inlineSuccess: {
    borderColor: colors.success + '55',
    backgroundColor: colors.success + '11',
  },
  inlineError: {
    borderColor: colors.error + '55',
    backgroundColor: colors.error + '11',
  },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  formField: { flexGrow: 1, flexBasis: 280, minWidth: 240 },
  formFullWidth: { width: '100%', marginBottom: 8 },
  subscriptionBlock: {
    marginTop: 4,
    padding: 4,
    borderRadius: 10,
  },
  historySection: { marginTop: 16, gap: 10 },
  historyTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyItem: { marginBottom: 4 },
  historyBlock: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  emptyState: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  successText: { color: colors.success, lineHeight: 20, fontSize: 14 },
  errorText: { color: colors.error, lineHeight: 20, fontSize: 14 },
});
