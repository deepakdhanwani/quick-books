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
import { api, Discount, SubscriptionPlan, SubscriberOption } from '../services/api';
import { colors } from '../theme/colors';
import { formatPlanDuration } from '../utils/planDuration';
import {
  DISCOUNT_SCOPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
  DiscountScope,
  DiscountType,
  formatDiscountType,
  formatDiscountValue,
  formatValidity,
  parseOptionalDate,
} from '../utils/discount';

type DiscountsScreenProps = {
  token: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function DiscountsScreen({ token }: DiscountsScreenProps) {
  const [items, setItems] = useState<Discount[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<SubscriberOption[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);

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
  const [type, setType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<DiscountScope>('ALL');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [subscriberIds, setSubscriberIds] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<DiscountType>('PERCENTAGE');
  const [editValue, setEditValue] = useState('');
  const [editScope, setEditScope] = useState<DiscountScope>('ALL');
  const [editValidFrom, setEditValidFrom] = useState('');
  const [editValidTo, setEditValidTo] = useState('');
  const [editPlanIds, setEditPlanIds] = useState<string[]>([]);
  const [editSubscriberIds, setEditSubscriberIds] = useState<string[]>([]);
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

  const subscriberOptions = useMemo(
    () =>
      subscribers.map((subscriber) => ({
        label: subscriber.businessName,
        value: String(subscriber.id),
        description: `${subscriber.ownerName} · ${subscriber.phone}`,
      })),
    [subscribers],
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

  const loadSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      const data = await api.getSelectableSubscribers(token);
      setSubscribers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers');
    } finally {
      setSubscribersLoading(false);
    }
  }, [token]);

  const loadItems = useCallback(async (targetPage = page, targetSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDiscounts(token, targetPage, targetSize);

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
      setError(err instanceof Error ? err.message : 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => {
    loadPlans();
    loadSubscribers();
  }, [loadPlans, loadSubscribers]);

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

  const parseValue = (discountType: DiscountType, rawValue: string) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('Enter a valid value greater than zero');
    }
    if (discountType === 'PERCENTAGE' && (parsed < 0.01 || parsed > 100)) {
      throw new Error('Percentage must be between 0.01% and 100%');
    }
    return parsed;
  };

  const parsePlanIds = (values: string[]) => {
    if (values.length === 0) {
      throw new Error('Select at least one subscription plan');
    }
    return values.map((item) => Number(item));
  };

  const parseSubscriberIds = (discountScope: DiscountScope, values: string[]) => {
    if (discountScope === 'ALL') return undefined;
    if (values.length === 0) {
      throw new Error('Select at least one subscriber');
    }
    return values.map((item) => Number(item));
  };

  const buildPayload = (
    discountName: string,
    discountType: DiscountType,
    rawValue: string,
    discountScope: DiscountScope,
    from: string,
    to: string,
    selectedPlanIds: string[],
    selectedSubscriberIds: string[],
  ) => {
    const parsedFrom = parseOptionalDate(from);
    const parsedTo = parseOptionalDate(to);
    if (parsedFrom && parsedTo && parsedFrom > parsedTo) {
      throw new Error('Valid from must be on or before valid to');
    }

    return {
      name: discountName,
      type: discountType,
      value: parseValue(discountType, rawValue),
      scope: discountScope,
      validFrom: parsedFrom,
      validTo: parsedTo,
      planIds: parsePlanIds(selectedPlanIds),
      subscriberIds: parseSubscriberIds(discountScope, selectedSubscriberIds),
    };
  };

  const resetCreateForm = () => {
    setName('');
    setType('PERCENTAGE');
    setValue('');
    setScope('ALL');
    setValidFrom('');
    setValidTo('');
    setPlanIds([]);
    setSubscriberIds([]);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = buildPayload(name, type, value, scope, validFrom, validTo, planIds, subscriberIds);
      await api.createDiscount(token, payload);
      resetCreateForm();
      setShowForm(false);
      setSuccess('Discount created.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: Discount) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditType(item.type);
    setEditValue(String(item.value));
    setEditScope(item.scope);
    setEditValidFrom(item.validFrom ?? '');
    setEditValidTo(item.validTo ?? '');
    setEditPlanIds(item.planIds.map(String));
    setEditSubscriberIds(item.subscriberIds.map(String));
    setEditActive(item.active ? 'true' : 'false');
    setShowForm(false);
    setDeleteConfirmId(null);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditType('PERCENTAGE');
    setEditValue('');
    setEditScope('ALL');
    setEditValidFrom('');
    setEditValidTo('');
    setEditPlanIds([]);
    setEditSubscriberIds([]);
    setEditActive('true');
  };

  const handleUpdate = async () => {
    if (editingId == null) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = buildPayload(
        editName,
        editType,
        editValue,
        editScope,
        editValidFrom,
        editValidTo,
        editPlanIds,
        editSubscriberIds,
      );
      await api.updateDiscount(token, editingId, {
        ...payload,
        active: editActive === 'true',
      });
      cancelEdit();
      setSuccess('Discount updated.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await api.deleteDiscount(token, id);
      setDeleteConfirmId(null);
      setSuccess('Discount deleted.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete discount');
    } finally {
      setDeleting(false);
    }
  };

  const formatPlans = (item: Discount) => {
    if (item.planNames.length === 0) return '—';
    return item.planNames.join(', ');
  };

  const formatScopeDetail = (item: Discount) => {
    if (item.scope === 'ALL') return 'All subscribers';
    if (item.subscriberNames.length === 0) return '—';
    return item.subscriberNames.join(', ');
  };

  const valueLabel = (discountType: DiscountType) =>
    discountType === 'PERCENTAGE' ? 'Value (%)' : 'Value (₹)';

  const renderPlanPicker = (selectedValues: string[], onChange: (values: string[]) => void) => {
    if (plansLoading) {
      return <ActivityIndicator color={colors.primary} style={styles.subscribersLoading} />;
    }

    return (
      <CheckboxList
        label="Applicable Plans"
        options={planOptions}
        selectedValues={selectedValues}
        onChange={onChange}
        emptyText="Create an active subscription plan first"
      />
    );
  };

  const renderSubscriberPicker = (
    discountScope: DiscountScope,
    selectedValues: string[],
    onChange: (values: string[]) => void,
  ) => {
    if (discountScope !== 'SPECIFIC') return null;

    if (subscribersLoading) {
      return <ActivityIndicator color={colors.primary} style={styles.subscribersLoading} />;
    }

    return (
      <CheckboxList
        label="Eligible Subscribers"
        options={subscriberOptions}
        selectedValues={selectedValues}
        onChange={onChange}
        emptyText="Create an active subscriber first"
      />
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="Discounts"
        subtitle="Promotional discounts applied at subscription signup or renewal"
        action={
          <Button
            title={showForm ? 'Cancel' : '+ Add Discount'}
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
          <Text style={styles.formTitle}>New Discount</Text>
          <View style={[styles.formRow, styles.formRowPrimary]}>
            <View style={styles.formField}>
              <Input label="Discount Name" value={name} onChangeText={setName} placeholder="e.g. New Year Offer" />
            </View>
            <View style={styles.formField}>
              <Select
                label="Type"
                value={type}
                options={DISCOUNT_TYPE_OPTIONS}
                onChange={(next) => setType(next as DiscountType)}
              />
            </View>
            <View style={styles.formField}>
              <Input
                label={valueLabel(type)}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder={type === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 100'}
              />
            </View>
          </View>
          <View style={[styles.formRow, styles.formRowSecondary]}>
            <View style={styles.formField}>
              <Select
                label="Scope"
                value={scope}
                options={DISCOUNT_SCOPE_OPTIONS}
                onChange={(next) => setScope(next as DiscountScope)}
              />
            </View>
            <View style={styles.formField}>
              <Input
                label="Valid From (optional)"
                value={validFrom}
                onChangeText={setValidFrom}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.formField}>
              <Input
                label="Valid To (optional)"
                value={validTo}
                onChangeText={setValidTo}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
          <View style={styles.formBelow}>
            {renderPlanPicker(planIds, setPlanIds)}
            {renderSubscriberPicker(scope, subscriberIds, setSubscriberIds)}
          </View>
          <Button title="Save Discount" onPress={handleCreate} loading={saving} disabled={plansLoading} />
        </Card>
      ) : null}

      {editingId != null ? (
        <Card>
          <Text style={styles.formTitle}>Edit Discount</Text>
          <View style={[styles.formRow, styles.formRowPrimary]}>
            <View style={styles.formField}>
              <Input label="Discount Name" value={editName} onChangeText={setEditName} />
            </View>
            <View style={styles.formField}>
              <Select
                label="Type"
                value={editType}
                options={DISCOUNT_TYPE_OPTIONS}
                onChange={(next) => setEditType(next as DiscountType)}
              />
            </View>
            <View style={styles.formField}>
              <Input
                label={valueLabel(editType)}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={[styles.formRow, styles.formRowSecondary]}>
            <View style={styles.formField}>
              <Select
                label="Scope"
                value={editScope}
                options={DISCOUNT_SCOPE_OPTIONS}
                onChange={(next) => setEditScope(next as DiscountScope)}
              />
            </View>
            <View style={styles.formField}>
              <Input
                label="Valid From (optional)"
                value={editValidFrom}
                onChangeText={setEditValidFrom}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.formField}>
              <Input
                label="Valid To (optional)"
                value={editValidTo}
                onChangeText={setEditValidTo}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
          <View style={styles.formBelow}>
            {renderPlanPicker(editPlanIds, setEditPlanIds)}
            {renderSubscriberPicker(editScope, editSubscriberIds, setEditSubscriberIds)}
          </View>
          <View style={[styles.formRow, styles.formRowStatus]}>
            <View style={styles.formField}>
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
            <Text style={styles.empty}>No discounts configured yet.</Text>
            <Text style={styles.emptyHint}>
              Create percentage or fixed discounts for all subscribers or specific ones. Applied automatically at signup and renewal.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellHeader, styles.colName]}>Name</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colType]}>Type</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colValue]}>Value</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colPlans]}>Plans</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colScope]}>Scope</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colValidity]}>Validity</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colStatus]}>Status</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colActions]}>Actions</Text>
            </View>
            {items.map((item) => (
              <View key={item.id}>
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colName]}>{item.name}</Text>
                  <Text style={[styles.cell, styles.colType]}>{formatDiscountType(item.type)}</Text>
                  <Text style={[styles.cell, styles.colValue]}>{formatDiscountValue(item.type, item.value)}</Text>
                  <Text style={[styles.cell, styles.colPlans]} numberOfLines={2}>
                    {formatPlans(item)}
                  </Text>
                  <Text style={[styles.cell, styles.colScope]} numberOfLines={2}>
                    {formatScopeDetail(item)}
                  </Text>
                  <Text style={[styles.cell, styles.colValidity]} numberOfLines={2}>
                    {formatValidity(item.validFrom, item.validTo)}
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
    overflow: 'visible',
  },
  formRowPrimary: {
    zIndex: 4,
  },
  formRowSecondary: {
    zIndex: 3,
  },
  formRowStatus: {
    zIndex: 10,
  },
  formField: { flexGrow: 1, flexBasis: 220, minWidth: 200, overflow: 'visible' },
  formBelow: {
    position: 'relative',
    zIndex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    position: 'relative',
    zIndex: 1,
  },
  listCard: {
    marginTop: 24,
  },
  subscribersLoading: { marginVertical: 16 },
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
  colType: { flex: 0.8 },
  colValue: { flex: 0.8 },
  colPlans: { flex: 1.4 },
  colScope: { flex: 1.4 },
  colValidity: { flex: 1.2 },
  colStatus: { flex: 0.7 },
  colActions: { flex: 0.7, minWidth: 88 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { color: colors.textSecondary, fontSize: 13, marginRight: 4 },
  active: { color: colors.success },
  inactive: { color: colors.textSecondary },
  deleting: { marginVertical: 8 },
});
