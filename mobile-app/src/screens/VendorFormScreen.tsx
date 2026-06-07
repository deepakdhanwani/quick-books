import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api } from '../services/api';
import { colors } from '../theme/colors';

type VendorFormScreenProps = {
  token: string;
  vendorId?: number;
  onSaved: () => void;
};

export function VendorFormScreen({ token, vendorId, onSaved }: VendorFormScreenProps) {
  const isEditing = vendorId != null;

  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadVendor = useCallback(
    async (isPullRefresh = false) => {
      if (!isEditing || vendorId == null) {
        return;
      }

      if (!isPullRefresh) {
        setLoading(true);
      }
      setError('');
      try {
        const vendor = await api.getVendor(token, vendorId);
        setBusinessName(vendor.businessName ?? vendor.name);
        setGstNumber(vendor.gstNumber ?? '');
        setBusinessDetails(vendor.businessDetails ?? '');
        setContactPerson(vendor.contactPerson ?? '');
        setPhone(vendor.phone ?? '');
        setEmail(vendor.email ?? '');
        setAddress(vendor.address ?? '');
        setActive(vendor.active);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load vendor');
      } finally {
        setLoading(false);
      }
    },
    [vendorId, isEditing, token],
  );

  useEffect(() => {
    if (isEditing) {
      loadVendor();
    }
  }, [isEditing, loadVendor]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVendor(true);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const trimmedBusinessName = businessName.trim();
      const payload = {
        name: trimmedBusinessName,
        businessName: trimmedBusinessName,
        vendorType: 'OTHER' as const,
        gstNumber: gstNumber.trim() || undefined,
        businessDetails: businessDetails.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        active,
      };

      if (isEditing && vendorId != null) {
        await api.updateVendor(token, vendorId, payload);
      } else {
        await api.createVendor(token, payload);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save vendor');
    } finally {
      setSaving(false);
    }
  };

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
      <Card>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Business Information</Text>
          <Text style={styles.sectionHint}>Enter the vendor's business details.</Text>
          <Input
            label="Business Name *"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
          <Input
            label="GST Number"
            value={gstNumber}
            onChangeText={setGstNumber}
            autoCapitalize="characters"
          />
          <Input
            label="Additional Business Details"
            value={businessDetails}
            onChangeText={setBusinessDetails}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
            placeholder="Business type, products supplied, notes, etc."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contact Details</Text>
          <Text style={styles.sectionHint}>Contact person, phone, email, and address for this business.</Text>
          <Input
            label="Contact Person"
            value={contactPerson}
            onChangeText={setContactPerson}
            autoCapitalize="words"
          />
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />
        </View>

        <View style={styles.activeRow}>
          <Text style={styles.activeLabel}>Active vendor</Text>
          <Text style={styles.activeHint}>
            Inactive vendors stay in history but are hidden from new purchases.
          </Text>
          <View style={styles.activeSwitchRow}>
            <Text style={styles.activeValue}>{active ? 'Active' : 'Inactive'}</Text>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: colors.border, true: 'rgba(34, 197, 94, 0.35)' }}
              thumbColor={active ? colors.success : colors.textSecondary}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={isEditing ? 'Save Changes' : 'Create Vendor'}
          onPress={handleSave}
          loading={saving}
        />
      </Card>
    </RefreshableScrollView>
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
  section: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  activeRow: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  activeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
});
