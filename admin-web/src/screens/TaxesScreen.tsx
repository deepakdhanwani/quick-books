import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CheckboxList } from '../components/CheckboxList';
import { IconButton } from '../components/IconButton';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { api, SubscriptionPlan, Tax } from '../services/api';
import { colors } from '../theme/colors';
import { formatPlanDuration } from '../utils/planDuration';

type TaxesScreenProps = {
  token: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function TaxesScreen({ token }: TaxesScreenProps) {
  const [items, setItems] = useState<Tax[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

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
  const [rate, setRate] = useState('');
  const [planIds, setPlanIds] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editPlanIds, setEditPlanIds] = useState<string[]>([]);
  const [editActive, setEditActive] = useState('true');

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const planOptions = useMemo(
    () =>
      plans.map((plan) => ({
        label: plan.name,
        value: String(plan.id),
        description: `${formatPlanDuration(plan.duration)} · ₹${plan.price.toLocaleString('en-IN')}`,
      })),
    [plans],
  );

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data = await api.getActiveSubscriptionPlans(token);
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription plans');
    } finally {
      setPlansLoading(false);
    }
  }, [token]);

  const loadItems = useCallback(async (targetPage = page, targetSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTaxes(token, targetPage, targetSize);

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
      setError(err instanceof Error ? err.message : 'Failed to load taxes');
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

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

  const parseRate = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0.01 || parsed > 100) {
      throw new Error('Enter a valid rate between 0.01% and 100%');
    }
    return parsed;
  };

  const parsePlanIds = (values: string[]) => {
    if (values.length === 0) {
      throw new Error('Select at least one subscription plan');
    }
    return values.map((value) => Number(value));
  };

  const resetCreateForm = () => {
    setName('');
    setRate('');
    setPlanIds([]);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const parsedRate = parseRate(rate);
      const parsedPlanIds = parsePlanIds(planIds);
      await api.createTax(token, {
        name,
        rate: parsedRate,
        planIds: parsedPlanIds,
      });
      resetCreateForm();
      setShowForm(false);
      setSuccess('Tax created.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tax');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: Tax) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditRate(String(item.rate));
    setEditPlanIds(item.applicablePlanIds.map(String));
    setEditActive(item.active ? 'true' : 'false');
    setShowForm(false);
    setDeleteConfirmId(null);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRate('');
    setEditPlanIds([]);
    setEditActive('true');
  };

  const handleUpdate = async () => {
    if (editingId == null) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const parsedRate = parseRate(editRate);
      const parsedPlanIds = parsePlanIds(editPlanIds);
      await api.updateTax(token, editingId, {
        name: editName,
        rate: parsedRate,
        planIds: parsedPlanIds,
        active: editActive === 'true',
      });
      cancelEdit();
      setSuccess('Tax updated.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tax');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await api.deleteTax(token, id);
      setDeleteConfirmId(null);
      setSuccess('Tax deleted.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tax');
    } finally {
      setDeleting(false);
    }
  };

  const formatPlans = (item: Tax) => {
    if (item.applicablePlanNames.length === 0) return '—';
    return item.applicablePlanNames.join(', ');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="Taxes"
        subtitle="Government taxes applied when subscribers sign up or renew"
        action={
          <Button
            title={showForm ? 'Cancel' : '+ Add Tax'}
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
          <Text style={styles.formTitle}>New Tax</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Input label="Tax Name" value={name} onChangeText={setName} placeholder="e.g. GST" />
            </View>
            <View style={styles.formField}>
              <Input
                label="Rate (%)"
                value={rate}
                onChangeText={setRate}
                keyboardType="decimal-pad"
                placeholder="e.g. 18"
              />
            </View>
          </View>
          {plansLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.plansLoading} />
          ) : (
            <CheckboxList
              label="Applicable Plans"
              options={planOptions}
              selectedValues={planIds}
              onChange={setPlanIds}
              emptyText="Create an active subscription plan first"
            />
          )}
          <Button title="Save Tax" onPress={handleCreate} loading={saving} disabled={plansLoading} />
        </Card>
      ) : null}

      {editingId != null ? (
        <Card>
          <Text style={styles.formTitle}>Edit Tax</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Input label="Tax Name" value={editName} onChangeText={setEditName} />
            </View>
            <View style={styles.formField}>
              <Input
                label="Rate (%)"
                value={editRate}
                onChangeText={setEditRate}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          {plansLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.plansLoading} />
          ) : (
            <CheckboxList
              label="Applicable Plans"
              options={planOptions}
              selectedValues={editPlanIds}
              onChange={setEditPlanIds}
              emptyText="Create an active subscription plan first"
            />
          )}
          <View style={styles.statusRow}>
            <Select
              label="Status"
              value={editActive}
              options={[
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ]}
              onChange={setEditActive}
            />
          </View>
          <View style={styles.formActions}>
            <Button title="Save Changes" onPress={handleUpdate} loading={saving} disabled={plansLoading} />
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
            <Text style={styles.empty}>No taxes configured yet.</Text>
            <Text style={styles.emptyHint}>
              Define tax rates and assign them to subscription plans. Taxes are applied at signup and renewal.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellHeader, styles.colName]}>Name</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colRate]}>Rate</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colPlans]}>Plans</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colStatus]}>Status</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colActions]}>Actions</Text>
            </View>
            {items.map((item) => (
              <View key={item.id}>
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colName]}>{item.name}</Text>
                  <Text style={[styles.cell, styles.colRate]}>{formatRate(item.rate)}</Text>
                  <Text style={[styles.cell, styles.colPlans]} numberOfLines={2}>
                    {formatPlans(item)}
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

function formatRate(rate: number) {
  return `${rate.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
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
  },
  formField: { flexGrow: 1, flexBasis: 220, minWidth: 200 },
  statusRow: { position: 'relative', zIndex: 10 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 12, position: 'relative', zIndex: 1 },
  listCard: { marginTop: 24 },
  plansLoading: { marginVertical: 16 },
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
  colName: { flex: 1.2 },
  colRate: { flex: 0.7 },
  colPlans: { flex: 2 },
  colStatus: { flex: 0.7 },
  colActions: { flex: 0.7, minWidth: 88 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { color: colors.textSecondary, fontSize: 13, marginRight: 4 },
  active: { color: colors.success },
  inactive: { color: colors.textSecondary },
  deleting: { marginVertical: 8 },
});
