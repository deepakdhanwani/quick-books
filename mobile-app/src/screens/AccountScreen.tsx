import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, SubscriberAccountProfile } from '../services/api';
type AccountScreenProps = {
  token: string;
  profile: SubscriberAccountProfile | null;
  loading: boolean;
  error: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onSettingsSaved: (profile: SubscriberAccountProfile) => void;
  onChangePin: () => void;
  onSubscription: () => void;
  onManageTeam: () => void;
  onActivityLog: () => void;
  isOwner: boolean;
};

function formatSubscriptionStatus(status?: SubscriberAccountProfile['subscriptionStatus']) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'EXPIRED') return 'Expired';
  return 'No plan';
}

function statusColor(status: SubscriberAccountProfile['subscriptionStatus'] | undefined, colors: AppTheme["colors"]) {
  if (status === 'ACTIVE') return colors.success;
  if (status === 'EXPIRED') return colors.error;
  return colors.warning;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatTaxPercent(value?: number) {
  if (value == null) return '—';
  return `${value}%`;
}

export function AccountScreen({
  token,
  profile,
  loading,
  error,
  refreshing,
  onRefresh,
  onSettingsSaved,
  onChangePin,
  onSubscription,
  onManageTeam,
  onActivityLog,
  isOwner,
}: AccountScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const canChangePin = profile?.canChangePin ?? isOwner;
  const [gstNumber, setGstNumber] = useState('');
  const [defaultTaxPercent, setDefaultTaxPercent] = useState('');
  const [editingSettings, setEditingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const syncFormFromProfile = () => {
    setGstNumber(profile?.gstNumber ?? '');
    setDefaultTaxPercent(
      profile?.defaultTaxPercent != null ? String(profile.defaultTaxPercent) : '',
    );
  };

  useEffect(() => {
    if (!editingSettings) {
      syncFormFromProfile();
    }
  }, [profile?.gstNumber, profile?.defaultTaxPercent, editingSettings]);

  const handleStartEdit = () => {
    syncFormFromProfile();
    setSettingsError('');
    setSettingsSuccess('');
    setEditingSettings(true);
  };

  const handleCancelEdit = () => {
    syncFormFromProfile();
    setSettingsError('');
    setEditingSettings(false);
  };

  const handleSaveSettings = async () => {
    const taxValue = defaultTaxPercent.trim();
    let parsedTax: number | null = null;

    if (taxValue) {
      parsedTax = Number(taxValue);
      if (Number.isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
        setSettingsError('Default tax percent must be between 0 and 100');
        setSettingsSuccess('');
        return;
      }
    }

    setSaving(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const updated = await api.updateAccountSettings(token, {
        gstNumber: gstNumber.trim() || null,
        defaultTaxPercent: parsedTax,
      });
      onSettingsSaved(updated);
      setEditingSettings(false);
      setSettingsSuccess('Sales settings saved');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Text style={styles.sectionTitle}>Account Details</Text>
        {loading && !profile ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <DetailRow label="Signed in as" value={profile?.loggedInUserName ?? profile?.ownerName ?? '—'} />
            <DetailRow label="Business" value={profile?.businessName ?? '—'} />
            <DetailRow label="Owner" value={profile?.ownerName ?? '—'} />
            <DetailRow label="Mobile" value={profile?.phone ?? '—'} />
            <DetailRow label="Business Type" value={profile?.businessTypeName ?? '—'} />
            <DetailRow label="Member Since" value={formatDate(profile?.createdAt)} />
            <DetailRow
              label="Subscription"
              value={formatSubscriptionStatus(profile?.subscriptionStatus)}
              valueColor={statusColor(profile?.subscriptionStatus, theme.colors)}
            />
            {profile?.currentSubscription ? (
              <>
                <DetailRow label="Current Plan" value={profile.currentSubscription.planName} />
                <DetailRow
                  label="Next Renewal Date"
                  value={formatDate(profile.currentSubscription.endDate)}
                />
              </>
            ) : null}
          </>
        )}
      </Card>

      {isOwner ? (
      <Card style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Text style={styles.sectionTitle}>Sales Settings</Text>
          {!editingSettings ? (
            <Pressable style={styles.editButton} onPress={handleStartEdit}>
              <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>

        {editingSettings ? (
          <>
            <Text style={styles.settingsHint}>
              Default tax percent is pre-filled when you create a new sale.
            </Text>
            <Input
              label="GST Number"
              value={gstNumber}
              onChangeText={setGstNumber}
              autoCapitalize="characters"
              placeholder="e.g. 22AAAAA0000A1Z5"
            />
            <Input
              label="Default Tax %"
              value={defaultTaxPercent}
              onChangeText={setDefaultTaxPercent}
              keyboardType="decimal-pad"
              placeholder="e.g. 18"
            />
            {settingsError ? <Text style={styles.error}>{settingsError}</Text> : null}
            <View style={styles.settingsActions}>
              <View style={styles.settingsActionButton}>
                <Button title="Cancel" variant="secondary" onPress={handleCancelEdit} />
              </View>
              <View style={styles.settingsActionButton}>
                <Button title="Save" onPress={handleSaveSettings} loading={saving} />
              </View>
            </View>
          </>
        ) : (
          <>
            <DetailRow label="GST Number" value={profile?.gstNumber?.trim() || '—'} />
            <DetailRow
              label="Default Tax %"
              value={formatTaxPercent(profile?.defaultTaxPercent)}
            />
            {settingsSuccess ? <Text style={styles.success}>{settingsSuccess}</Text> : null}
          </>
        )}
      </Card>
      ) : null}

      <Text style={styles.actionsTitle}>Account Actions</Text>

      {canChangePin ? (
        <Pressable style={styles.actionRow} onPress={onChangePin}>
          <View style={styles.actionIcon}>
            <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Change Login PIN</Text>
            <Text style={styles.actionHint}>Update your secure sign-in PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      ) : (
        <Card>
          <Text style={styles.staffPinNote}>
            Your PIN is managed by the account owner. Contact the owner if you need a new PIN.
          </Text>
        </Card>
      )}

      {isOwner ? (
        <>
          <Pressable style={styles.actionRow} onPress={onManageTeam}>
            <View style={styles.actionIcon}>
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Team Users</Text>
              <Text style={styles.actionHint}>Create users and assign PINs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={onActivityLog}>
            <View style={styles.actionIcon}>
              <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Activity Log</Text>
              <Text style={styles.actionHint}>View create, edit, and delete history</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={onSubscription}>
            <View style={styles.actionIcon}>
              <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Subscription Plans</Text>
              <Text style={styles.actionHint}>View or manage your subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        </>
      ) : null}
    </RefreshableScrollView>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedValueColor = valueColor ?? theme.colors.text;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: resolvedValueColor }]}>{value}</Text>
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
  sectionLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(16),
    fontWeight: '700',
  },
  settingsCard: {
    marginTop: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  settingsActionButton: {
    flex: 1,
  },
  settingsHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    marginBottom: 12,
    lineHeight: theme.scaleFont(18),
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '500',
  },
  actionsTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '600',
  },
  actionHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginTop: 2,
  },
  error: {
    color: theme.colors.error,
    marginBottom: 12,
  },
  success: {
    color: theme.colors.success,
    marginBottom: 12,
  },
  staffPinNote: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    lineHeight: theme.scaleFont(18),
  },

  };
}
