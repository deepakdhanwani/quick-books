import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Vendor } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { colors } from '../theme/colors';
import { getVendorDisplayName } from '../utils/vendorType';

type VendorDetailScreenProps = {
  token: string;
  vendorId: number;
  onEdit: () => void;
  onDeleted: () => void;
};

function getSubtitle(vendor: Vendor) {
  return vendor.contactPerson ?? vendor.phone ?? vendor.email ?? 'No contact info';
}

export function VendorDetailScreen({
  token,
  vendorId,
  onEdit,
  onDeleted,
}: VendorDetailScreenProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [error, setError] = useState('');

  const loadVendor = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) {
        setLoading(true);
      }
      setError('');
      try {
        const data = await api.getVendor(token, vendorId);
        setVendor(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load vendor');
      } finally {
        setLoading(false);
      }
    },
    [vendorId, token],
  );

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVendor(true);
    setRefreshing(false);
  };

  const handleToggleActive = async (value: boolean) => {
    if (!vendor) {
      return;
    }
    setTogglingActive(true);
    try {
      const updated = await api.setVendorActive(token, vendor.id, value);
      setVendor(updated);
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleDelete = () => {
    if (!vendor) {
      return;
    }

    appAlert(
      'Delete vendor',
      `Delete ${getVendorDisplayName(vendor)}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteVendor(token, vendor.id);
              onDeleted();
            } catch (err) {
              appAlert('Delete failed', err instanceof Error ? err.message : 'Could not delete vendor');
            }
          },
        },
      ],
    );
  };

  if (loading && !vendor) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error || 'Vendor not found'}</Text>
      </View>
    );
  }

  const avatarColor = vendor.active ? colors.success : colors.textSecondary;
  const displayName = getVendorDisplayName(vendor);

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <Card style={styles.headerCard}>
        <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: avatarColor }]} />
        </View>
        <Text style={[styles.name, !vendor.active && styles.nameInactive]}>{displayName}</Text>
        <Text style={styles.subtitle}>{getSubtitle(vendor)}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Business Information</Text>
        <DetailRow icon="business-outline" label="Business Name" value={displayName} />
        <DetailRow icon="document-text-outline" label="GST Number" value={vendor.gstNumber} />
        <DetailRow
          icon="information-circle-outline"
          label="Business Details"
          value={vendor.businessDetails}
        />

        <Text style={styles.cardTitle}>Contact Details</Text>
        <DetailRow icon="person-outline" label="Contact Person" value={vendor.contactPerson} />
        <DetailRow icon="call-outline" label="Phone" value={vendor.phone} />
        <DetailRow icon="mail-outline" label="Email" value={vendor.email} />
        <DetailRow icon="location-outline" label="Address" value={vendor.address} />

        <View style={styles.activeRow}>
          <View>
            <Text style={styles.activeLabel}>Status</Text>
            <Text style={styles.activeHint}>{vendor.active ? 'Active vendor' : 'Inactive vendor'}</Text>
          </View>
          <Switch
            value={vendor.active}
            onValueChange={handleToggleActive}
            disabled={togglingActive}
            trackColor={{ false: colors.border, true: 'rgba(34, 197, 94, 0.35)' }}
            thumbColor={vendor.active ? colors.success : colors.textSecondary}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button title="Edit Vendor" onPress={onEdit} />
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete Vendor</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RefreshableScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
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
    padding: 24,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  nameInactive: {
    color: colors.textSecondary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailText: {
    flex: 1,
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
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    gap: 16,
  },
  activeLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  activeHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
});
