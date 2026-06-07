import { useCallback, useEffect, useState } from 'react';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, CustomerType } from '../services/api';
import {
  CUSTOMER_TYPE_OPTIONS,
  getBusinessNameLabel,
  isBusinessCustomerType,
} from '../utils/customerType';

type CustomerFormScreenProps = {
  token: string;
  customerId?: number;
  onSaved: () => void;
};

export function CustomerFormScreen({ token, customerId, onSaved }: CustomerFormScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const isEditing = customerId != null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | undefined>();
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const showBusinessFields = isBusinessCustomerType(customerType);

  const loadCustomer = useCallback(
    async (isPullRefresh = false) => {
      if (!isEditing || customerId == null) {
        return;
      }

      if (!isPullRefresh) {
        setLoading(true);
      }
      setError('');
      try {
        const customer = await api.getCustomer(token, customerId);
        setName(customer.name);
        setPhone(customer.phone ?? '');
        setEmail(customer.email ?? '');
        setAddress(customer.address ?? '');
        setCustomerType(customer.customerType);
        setBusinessName(customer.businessName ?? '');
        setGstNumber(customer.gstNumber ?? '');
        setBusinessDetails(customer.businessDetails ?? '');
        setActive(customer.active);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load customer');
      } finally {
        setLoading(false);
      }
    },
    [customerId, isEditing, token],
  );

  useEffect(() => {
    if (isEditing) {
      loadCustomer();
    }
  }, [isEditing, loadCustomer]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomer(true);
    setRefreshing(false);
  };

  const handleTypeSelect = (type: CustomerType) => {
    setCustomerType((current) => {
      if (current === type) {
        if (isBusinessCustomerType(type)) {
          setBusinessName('');
          setGstNumber('');
          setBusinessDetails('');
        }
        return undefined;
      }
      if (type === 'INDIVIDUAL') {
        setBusinessName('');
        setGstNumber('');
        setBusinessDetails('');
      }
      return type;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        customerType,
        businessName: showBusinessFields ? businessName.trim() || undefined : undefined,
        gstNumber: showBusinessFields ? gstNumber.trim() || undefined : undefined,
        businessDetails:
          customerType === 'OTHER' ? businessDetails.trim() || undefined : undefined,
        active,
      };

      if (isEditing && customerId != null) {
        await api.updateCustomer(token, customerId, payload);
      } else {
        await api.createCustomer(token, payload);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
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
        <Text style={styles.sectionLabel}>Customer Type</Text>
        <Text style={styles.sectionHint}>Optional — choose Individual, Company, Shop, or Other Business.</Text>
        <View style={styles.typeRow}>
          {CUSTOMER_TYPE_OPTIONS.map((option) => {
            const selected = customerType === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.typeChip, selected && styles.typeChipActive]}
                onPress={() => handleTypeSelect(option.value)}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input label="Customer Name *" value={name} onChangeText={setName} autoCapitalize="words" />
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
          style={styles.addressInput}
        />

        {showBusinessFields ? (
          <View style={styles.businessSection}>
            <Text style={styles.sectionLabel}>Business Details</Text>
            <Text style={styles.sectionHint}>All fields below are optional.</Text>
            <Input
              label={getBusinessNameLabel(customerType)}
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
            {customerType === 'OTHER' ? (
              <Input
                label="Additional Business Details"
                value={businessDetails}
                onChangeText={setBusinessDetails}
                multiline
                numberOfLines={3}
                style={styles.addressInput}
                placeholder="Describe the business type, services, etc."
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.activeRow}>
          <Text style={styles.activeLabel}>Active customer</Text>
          <Text style={styles.activeHint}>
            Inactive customers stay in history but are hidden from new sales.
          </Text>
          <View style={styles.activeSwitchRow}>
            <Text style={styles.activeValue}>{active ? 'Active' : 'Inactive'}</Text>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: theme.colors.border, true: 'rgba(34, 197, 94, 0.35)' }}
              thumbColor={active ? theme.colors.success : theme.colors.textSecondary}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={isEditing ? 'Save Changes' : 'Create Customer'}
          onPress={handleSave}
          loading={saving}
        />
      </Card>
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
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    lineHeight: theme.scaleFont(17),
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  typeChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  typeChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  businessSection: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addressInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  activeRow: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeLabel: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '600',
    marginBottom: 4,
  },
  activeHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    lineHeight: theme.scaleFont(17),
    marginBottom: 12,
  },
  activeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeValue: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    fontWeight: '500',
  },
  error: {
    color: theme.colors.error,
    marginBottom: 12,
  },

  };
}
