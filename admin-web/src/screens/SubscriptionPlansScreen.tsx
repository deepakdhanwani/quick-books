import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { IconButton } from '../components/IconButton';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { api, SubscriptionPlan } from '../services/api';
import { colors } from '../theme/colors';
import { formatPlanDuration, PLAN_DURATION_OPTIONS } from '../utils/planDuration';

type SubscriptionPlansScreenProps = {
  token: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function SubscriptionPlansScreen({ token }: SubscriptionPlansScreenProps) {
  const [items, setItems] = useState<SubscriptionPlan[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('MONTHLY');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState('MONTHLY');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState('true');

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async (targetPage = page, targetSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSubscriptionPlans(token, targetPage, targetSize);

      if (data.content.length === 0 && data.totalElements > 0 && targetPage > 0) {
        const lastPage = Math.max(data.totalPages - 1, 0);
        setPage(lastPage);
        return;
      }

      setItems(data.content);
      setPage(data.page);
      setPageSize(data.size);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => {
    loadItems(page, pageSize);
  }, [page, pageSize, token]);

  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(nextPage, 0));
    setDeleteConfirmId(null);
    cancelEdit();
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(0);
    setDeleteConfirmId(null);
    cancelEdit();
  };

  const parsePrice = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('Enter a valid price greater than zero');
    }
    return parsed;
  };

  const resetCreateForm = () => {
    setName('');
    setDuration('MONTHLY');
    setPrice('');
    setDescription('');
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const parsedPrice = parsePrice(price);
      await api.createSubscriptionPlan(token, {
        name,
        duration: duration as SubscriptionPlan['duration'],
        price: parsedPrice,
        description: description || undefined,
      });
      resetCreateForm();
      setShowForm(false);
      setSuccess('Subscription plan created.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: SubscriptionPlan) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDuration(item.duration);
    setEditPrice(String(item.price));
    setEditDescription(item.description ?? '');
    setEditActive(item.active ? 'true' : 'false');
    setShowForm(false);
    setDeleteConfirmId(null);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDuration('MONTHLY');
    setEditPrice('');
    setEditDescription('');
    setEditActive('true');
  };

  const handleUpdate = async () => {
    if (editingId == null) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const parsedPrice = parsePrice(editPrice);
      await api.updateSubscriptionPlan(token, editingId, {
        name: editName,
        duration: editDuration as SubscriptionPlan['duration'],
        price: parsedPrice,
        description: editDescription || undefined,
        active: editActive === 'true',
      });
      cancelEdit();
      setSuccess('Subscription plan updated.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await api.deleteSubscriptionPlan(token, id);
      setDeleteConfirmId(null);
      setSuccess('Subscription plan deleted.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription plan');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="Subscription Plans"
        subtitle="Plans subscribers choose on first login or renewal"
        action={
          <Button
            title={showForm ? 'Cancel' : '+ Add Plan'}
            onPress={() => {
              setShowForm(!showForm);
              cancelEdit();
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
          <Text style={styles.formTitle}>New Subscription Plan</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Input label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Monthly Basic" />
            </View>
            <View style={styles.formField}>
              <Select label="Duration" value={duration} options={PLAN_DURATION_OPTIONS} onChange={setDuration} />
            </View>
            <View style={styles.formField}>
              <Input
                label="Price (₹)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="e.g. 499"
              />
            </View>
          </View>
          <View style={styles.formFullWidth}>
            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What is included in this plan?"
            />
          </View>
          <Button title="Save Plan" onPress={handleCreate} loading={saving} />
        </Card>
      ) : null}

      {editingId != null ? (
        <Card>
          <Text style={styles.formTitle}>Edit Subscription Plan</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Input label="Plan Name" value={editName} onChangeText={setEditName} />
            </View>
            <View style={styles.formField}>
              <Select label="Duration" value={editDuration} options={PLAN_DURATION_OPTIONS} onChange={setEditDuration} />
            </View>
            <View style={styles.formField}>
              <Input
                label="Price (₹)"
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={styles.formFullWidth}>
            <Input
              label="Description (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
            />
          </View>
          <Select
            label="Status"
            value={editActive}
            compact
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
            onChange={setEditActive}
          />
          <View style={styles.formActions}>
            <Button title="Save Changes" onPress={handleUpdate} loading={saving} />
            <Button title="Cancel" onPress={cancelEdit} variant="secondary" />
          </View>
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card style={styles.listCard}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : totalElements === 0 ? (
          <View>
            <Text style={styles.empty}>No subscription plans yet.</Text>
            <Text style={styles.emptyHint}>
              Create monthly, yearly, or custom plans for subscribers to choose on first login.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellHeader, styles.colName]}>Name</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colDuration]}>Duration</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colPrice]}>Price</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colDesc]}>Description</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colStatus]}>Status</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colActions]}>Actions</Text>
            </View>
            {items.map((item) => (
              <View key={item.id}>
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colName]}>{item.name}</Text>
                  <Text style={[styles.cell, styles.colDuration]}>{formatPlanDuration(item.duration)}</Text>
                  <Text style={[styles.cell, styles.colPrice]}>{formatCurrency(item.price)}</Text>
                  <Text style={[styles.cell, styles.colDesc]} numberOfLines={2}>
                    {item.description ?? '—'}
                  </Text>
                  <Text style={[styles.cell, styles.colStatus, item.active ? styles.active : styles.inactive]}>
                    {item.active ? 'Active' : 'Inactive'}
                  </Text>
                  <View style={[styles.colActions, styles.actions]}>
                    {deleteConfirmId === item.id ? (
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmText}>Delete?</Text>
                        <IconButton
                          icon="check"
                          variant="success"
                          accessibilityLabel="Confirm delete"
                          onPress={() => handleDelete(item.id)}
                          disabled={deleting}
                        />
                        <IconButton
                          icon="close"
                          variant="muted"
                          accessibilityLabel="Cancel delete"
                          onPress={() => setDeleteConfirmId(null)}
                          disabled={deleting}
                        />
                      </View>
                    ) : (
                      <>
                        <IconButton
                          icon="edit"
                          accessibilityLabel={`Edit ${item.name}`}
                          onPress={() => startEdit(item)}
                        />
                        <IconButton
                          icon="delete"
                          variant="danger"
                          accessibilityLabel={`Delete ${item.name}`}
                          onPress={() => {
                            setDeleteConfirmId(item.id);
                            cancelEdit();
                          }}
                        />
                      </>
                    )}
                  </View>
                </View>
                {deleting && deleteConfirmId === item.id ? (
                  <ActivityIndicator color={colors.primary} style={styles.deleting} />
                ) : null}
              </View>
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

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: { paddingBottom: 32 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
    position: 'relative',
    zIndex: 2,
  },
  formField: { flexGrow: 1, flexBasis: 220, minWidth: 200, overflow: 'visible' },
  formFullWidth: { width: '100%', marginBottom: 8, zIndex: 1 },
  statusRow: { position: 'relative', zIndex: 10 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 12, position: 'relative', zIndex: 1 },
  listCard: { marginTop: 24 },
  success: { color: colors.success },
  error: { color: colors.error, marginBottom: 16 },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingTop: 24 },
  emptyHint: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 12, fontSize: 13 },
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
  },
  cell: { color: colors.text, fontSize: 14 },
  cellHeader: { color: colors.textSecondary, fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
  colName: { flex: 1.4 },
  colDuration: { flex: 0.9 },
  colPrice: { flex: 1 },
  colDesc: { flex: 1.8 },
  colStatus: { flex: 0.7 },
  colActions: { flex: 0.7, minWidth: 88 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { color: colors.textSecondary, fontSize: 13, marginRight: 4 },
  active: { color: colors.success },
  inactive: { color: colors.textSecondary },
  deleting: { marginVertical: 8 },
});
