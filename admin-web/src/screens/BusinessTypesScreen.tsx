import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { IconButton } from '../components/IconButton';
import { api, BusinessType } from '../services/api';
import { colors } from '../theme/colors';

type BusinessTypesScreenProps = {
  token: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function BusinessTypesScreen({ token }: BusinessTypesScreenProps) {
  const [items, setItems] = useState<BusinessType[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState('true');

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async (targetPage = page, targetSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getBusinessTypes(token, targetPage, targetSize);

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
      setError(err instanceof Error ? err.message : 'Failed to load business types');
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

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.createBusinessType(token, { name, description: description || undefined });
      setName('');
      setDescription('');
      setShowForm(false);
      setSuccess('Business type created.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business type');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.seedBusinessTypes(token);
      setSuccess(
        `Added ${result.created} known business types. ${result.skipped} already existed (of ${result.totalKnown} total).`
      );
      setPage(0);
      await loadItems(0, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed business types');
    } finally {
      setSeeding(false);
    }
  };

  const startEdit = (item: BusinessType) => {
    setEditingId(item.id);
    setEditName(item.name);
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
    setEditDescription('');
    setEditActive('true');
  };

  const handleUpdate = async () => {
    if (editingId == null) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateBusinessType(token, editingId, {
        name: editName,
        description: editDescription || undefined,
        active: editActive === 'true',
      });
      cancelEdit();
      setSuccess('Business type updated.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await api.deleteBusinessType(token, id);
      setDeleteConfirmId(null);
      setSuccess('Business type deleted.');
      await loadItems(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete business type');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="Business Types"
        subtitle="Master list used when creating subscribers"
        action={
          <View style={styles.headerActions}>
            <Button
              title="Add All Known Types"
              onPress={handleSeedDefaults}
              loading={seeding}
              variant="secondary"
            />
            <Button
              title={showForm ? 'Cancel' : '+ Add Business Type'}
              onPress={() => {
                setShowForm(!showForm);
                cancelEdit();
                setError('');
              }}
              variant={showForm ? 'secondary' : 'primary'}
            />
          </View>
        }
      />

      {success ? (
        <Card>
          <Text style={styles.success}>{success}</Text>
        </Card>
      ) : null}

      {showForm ? (
        <Card>
          <Text style={styles.formTitle}>New Business Type</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Grocery Store" />
            </View>
            <View style={styles.formField}>
              <Input label="Description (optional)" value={description} onChangeText={setDescription} />
            </View>
          </View>
          <Button title="Save Business Type" onPress={handleCreate} loading={saving} />
        </Card>
      ) : null}

      {editingId != null ? (
        <Card>
          <Text style={styles.formTitle}>Edit Business Type</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Input label="Name" value={editName} onChangeText={setEditName} />
            </View>
            <View style={styles.formField}>
              <Input label="Description (optional)" value={editDescription} onChangeText={setEditDescription} />
            </View>
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
            <Button title="Save Changes" onPress={handleUpdate} loading={saving} />
            <Button title="Cancel" onPress={cancelEdit} variant="secondary" />
          </View>
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : totalElements === 0 ? (
          <View>
            <Text style={styles.empty}>No business types yet.</Text>
            <Text style={styles.emptyHint}>
              Click "Add All Known Types" to load 24 common shop types, or add your own manually.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellHeader, styles.colName]}>Name</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colDesc]}>Description</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colStatus]}>Status</Text>
              <Text style={[styles.cell, styles.cellHeader, styles.colActions]}>Actions</Text>
            </View>
            {items.map((item) => (
              <View key={item.id}>
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colName]}>{item.name}</Text>
                  <Text style={[styles.cell, styles.colDesc]}>{item.description ?? '—'}</Text>
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
  headerActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    position: 'relative',
    zIndex: 2,
  },
  formField: { flexGrow: 1, flexBasis: 280, minWidth: 240, overflow: 'visible' },
  formActions: { flexDirection: 'row', gap: 12 },
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
  colName: { flex: 1.5 },
  colDesc: { flex: 2 },
  colStatus: { flex: 0.7 },
  colActions: { flex: 0.7, minWidth: 88 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { color: colors.textSecondary, fontSize: 13, marginRight: 4 },
  active: { color: colors.success },
  inactive: { color: colors.textSecondary },
  deleting: { marginVertical: 8 },
});
