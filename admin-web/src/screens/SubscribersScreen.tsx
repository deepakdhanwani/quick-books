import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Autocomplete } from '../components/Autocomplete';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { api, BusinessType, Subscriber } from '../services/api';
import { colors } from '../theme/colors';
import { SubscriberDetailScreen } from './SubscriberDetailScreen';

type SubscribersScreenProps = {
  token: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function SubscribersScreen({ token }: SubscribersScreenProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<number | null>(null);
  const [initialPin, setInitialPin] = useState<string | undefined>();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessTypeQuery, setBusinessTypeQuery] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('');

  const loadBusinessTypes = useCallback(async () => {
    try {
      const types = await api.getActiveBusinessTypes(token);
      setBusinessTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business types');
    }
  }, [token]);

  const loadSubscribers = useCallback(async (targetPage = page, targetSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSubscribers(token, targetPage, targetSize);

      if (data.content.length === 0 && data.totalElements > 0 && targetPage > 0) {
        const lastPage = Math.max(data.totalPages - 1, 0);
        setPage(lastPage);
        return;
      }

      setSubscribers(data.content);
      setPage(data.page);
      setPageSize(data.size);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => {
    loadBusinessTypes();
  }, [loadBusinessTypes]);

  useEffect(() => {
    if (selectedSubscriberId == null) {
      loadSubscribers(page, pageSize);
    }
  }, [page, pageSize, token, selectedSubscriberId]);

  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(nextPage, 0));
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(0);
  };

  const resetCreateForm = () => {
    setBusinessName('');
    setOwnerName('');
    setPhone('');
    setBusinessTypeQuery('');
    setBusinessTypeId('');
  };

  const businessTypeOptions = businessTypes.map((type) => ({
    label: type.name,
    value: String(type.id),
    description: type.description,
  }));

  const handleCreate = async () => {
    if (!businessTypeId) {
      setError('Please select a business type from the suggestions');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const created = await api.createSubscriber(token, {
        businessName,
        ownerName,
        phone,
        businessTypeId: Number(businessTypeId),
      });
      resetCreateForm();
      setShowForm(false);
      setPage(0);
      setInitialPin(created.loginPin);
      setSelectedSubscriberId(created.id);
      setSuccess('Subscriber created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscriber');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (sub: Subscriber) => {
    setInitialPin(undefined);
    setSelectedSubscriberId(sub.id);
    setSuccess('');
    setError('');
    setShowForm(false);
  };

  const closeDetail = () => {
    setSelectedSubscriberId(null);
    setInitialPin(undefined);
    setSuccess('');
  };

  if (selectedSubscriberId != null) {
    return (
      <SubscriberDetailScreen
        token={token}
        subscriberId={selectedSubscriberId}
        initialPin={initialPin}
        onBack={closeDetail}
        onUpdated={() => loadSubscribers(page, pageSize)}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="Subscribers"
        subtitle="Create and manage shopkeeper accounts"
        action={
          <Button
            title={showForm ? 'Cancel' : '+ Add Subscriber'}
            onPress={() => {
              setShowForm(!showForm);
              setError('');
            }}
            variant={showForm ? 'secondary' : 'primary'}
          />
        }
      />

      {success ? (
        <Card>
          <Text style={styles.success}>{success}</Text>
        </Card>
      ) : null}

      {showForm ? (
        <Card>
          <Text style={styles.formTitle}>New Subscriber</Text>
          {businessTypes.length === 0 ? (
            <Text style={styles.warning}>
              No business types found. Go to Business Types in the sidebar and create at least one first.
            </Text>
          ) : null}
          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Input label="Business Name" value={businessName} onChangeText={setBusinessName} />
            </View>
            <View style={styles.formField}>
              <Input label="Owner Name" value={ownerName} onChangeText={setOwnerName} />
            </View>
            <View style={styles.formField}>
              <Input label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>
          <View style={styles.formFullWidth}>
            <Autocomplete
              label="Business Type"
              value={businessTypeQuery}
              selectedValue={businessTypeId}
              options={businessTypeOptions}
              placeholder="Type to search business type..."
              onChangeText={setBusinessTypeQuery}
              onSelect={(option) => {
                setBusinessTypeId(option.value);
                setBusinessTypeQuery(option.label);
              }}
              onClearSelection={() => setBusinessTypeId('')}
            />
          </View>
          <Button title="Create Subscriber" onPress={handleCreate} loading={saving} />
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card style={styles.listCard}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : totalElements === 0 ? (
          <Text style={styles.empty}>No subscribers yet. Click "Add Subscriber" to create one.</Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellHeader, styles.colBusiness]}>Business</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colOwner]}>Owner</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colPhone]}>Phone</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colType]}>Type</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colAccount]}>Account</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colSub]}>Subscription</Text>
            </View>
            {subscribers.map((sub) => (
              <Pressable
                key={sub.id}
                style={({ pressed }) => [styles.tableRow, pressed && styles.tableRowPressed]}
                onPress={() => openDetail(sub)}
              >
                <Text style={[styles.cell, styles.colBusiness]}>{sub.businessName}</Text>
                <Text style={[styles.cell, styles.colOwner]}>{sub.ownerName}</Text>
                <Text style={[styles.cell, styles.colPhone]}>{sub.phone}</Text>
                <Text style={[styles.cell, styles.colType]}>{sub.businessTypeName ?? '—'}</Text>
                <Text style={[styles.cell, styles.colAccount, sub.active ? styles.active : styles.inactive]}>
                  {sub.active ? 'Active' : 'Inactive'}
                </Text>
                <Text style={[styles.cell, styles.colSub, subscriptionStyle(sub.subscriptionStatus)]}>
                  {formatSubscriptionLabel(sub.subscriptionStatus)}
                </Text>
              </Pressable>
            ))}

            <Pagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function formatSubscriptionLabel(status: Subscriber['subscriptionStatus']) {
  if (status === 'NONE') return 'Not subscribed';
  if (status === 'ACTIVE') return 'Active';
  return 'Expired';
}

function subscriptionStyle(status: Subscriber['subscriptionStatus']) {
  if (status === 'ACTIVE') return { color: colors.success };
  if (status === 'EXPIRED') return { color: colors.error };
  return { color: colors.warning };
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: { paddingBottom: 32 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  formField: { flexGrow: 1, flexBasis: 280, minWidth: 240 },
  formFullWidth: { width: '100%', marginBottom: 8 },
  warning: { color: colors.warning, marginBottom: 16 },
  success: { color: colors.success },
  error: { color: colors.error, marginBottom: 16 },
  listCard: { marginTop: 24 },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    cursor: 'pointer',
  },
  tableRowPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  cell: { color: colors.text, fontSize: 14 },
  cellHeader: { color: colors.textSecondary, fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
  colBusiness: { flex: 2 },
  colOwner: { flex: 1.5 },
  colPhone: { flex: 1.4 },
  colType: { flex: 1.2 },
  colAccount: { flex: 1 },
  colSub: { flex: 1.2 },
  active: { color: colors.success },
  inactive: { color: colors.error },
});
