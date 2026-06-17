import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { CompanyCrud, CompanyOption, ModuleCrud, StaffPermissions } from '../services/api';
import type { CrudModule } from '../utils/staffPermissions';

type CrudAction = keyof ModuleCrud;

const CRUD_COLUMNS: { key: CrudAction; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

const COMPANY_COLUMNS: { key: keyof CompanyCrud; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

const MODULE_ROWS: { key: CrudModule; label: string; hint?: string }[] = [
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'sales', label: 'Sales / Invoices', hint: 'Create without edit = draft-only staff' },
  { key: 'purchases', label: 'Purchases / PO' },
  { key: 'products', label: 'Products' },
  { key: 'reminders', label: 'Reminders' },
];

type TeamUserPermissionsEditorProps = {
  companies: CompanyOption[];
  value: StaffPermissions;
  onChange: (value: StaffPermissions) => void;
};

export function TeamUserPermissionsEditor({
  companies,
  value,
  onChange,
}: TeamUserPermissionsEditorProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const toggleCompany = (companyId: number) => {
    const selected = new Set(value.companyIds);
    if (selected.has(companyId)) {
      selected.delete(companyId);
    } else {
      selected.add(companyId);
    }
    onChange({ ...value, companyIds: Array.from(selected) });
  };

  const setModuleCrud = (module: CrudModule, next: ModuleCrud) => {
    onChange({ ...value, [module]: next });
  };

  const toggleModuleAction = (module: CrudModule, action: CrudAction) => {
    const current = value[module];
    setModuleCrud(module, { ...current, [action]: !current[action] });
  };

  const toggleCompanyAction = (action: keyof CompanyCrud) => {
    onChange({
      ...value,
      companies: { ...value.companies, [action]: !value.companies[action] },
    });
  };

  const renderCrudCell = (module: CrudModule, action: CrudAction) => {
    const enabled = value[module][action];
    return (
      <Pressable
        key={action}
        style={[styles.crudCell, enabled && styles.crudCellOn]}
        onPress={() => toggleModuleAction(module, action)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel={`${MODULE_ROWS.find((row) => row.key === module)?.label} ${action}`}
      >
        {enabled ? (
          <Ionicons name="checkmark" size={12} color={theme.colors.primary} />
        ) : (
          <View style={styles.crudCellEmpty} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Company access</Text>
      <Text style={styles.hint}>Which companies this user can open in the app.</Text>
      {companies.length === 0 ? (
        <Text style={styles.empty}>No companies available yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {companies.map((company) => {
            const selected = value.companyIds.includes(company.id);
            return (
              <Pressable
                key={company.id}
                onPress={() => toggleCompany(company.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                  {company.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>General</Text>
      <View style={styles.generalRow}>
        <Text style={styles.generalLabel}>Dashboard</Text>
        <Switch
          value={value.viewDashboard}
          onValueChange={(enabled) => onChange({ ...value, viewDashboard: enabled })}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '88' }}
          thumbColor={value.viewDashboard ? theme.colors.primary : theme.colors.surfaceElevated}
        />
      </View>
      <View style={styles.generalRow}>
        <Text style={styles.generalLabel}>Reports</Text>
        <Switch
          value={value.viewReports}
          onValueChange={(enabled) => onChange({ ...value, viewReports: enabled })}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '88' }}
          thumbColor={value.viewReports ? theme.colors.primary : theme.colors.surfaceElevated}
        />
      </View>

      <Text style={styles.sectionTitle}>Companies (admin)</Text>
      <Text style={styles.hint}>Create new companies from the drawer. Edit/delete are reserved for future use.</Text>
      <View style={styles.matrixCard}>
        <View style={styles.matrixHeaderRow}>
          <Text style={styles.moduleHeader}> </Text>
          {COMPANY_COLUMNS.map((column) => (
            <Text key={column.key} style={styles.columnHeader}>
              {column.label}
            </Text>
          ))}
        </View>
        <View style={styles.matrixRow}>
          <Text style={styles.moduleLabel}>Companies</Text>
          {COMPANY_COLUMNS.map((column) => {
            const enabled = value.companies[column.key];
            return (
              <Pressable
                key={column.key}
                style={[styles.crudCell, enabled && styles.crudCellOn]}
                onPress={() => toggleCompanyAction(column.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: enabled }}
              >
                {enabled ? (
                  <Ionicons name="checkmark" size={12} color={theme.colors.primary} />
                ) : (
                  <View style={styles.crudCellEmpty} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Module permissions</Text>
      <Text style={styles.hint}>
        Example: enable View + Create on Sales so staff can raise invoices but not change or remove them.
      </Text>

      <View style={styles.matrixCard}>
        <View style={styles.matrixHeaderRow}>
          <Text style={styles.moduleHeader}>Module</Text>
          {CRUD_COLUMNS.map((column) => (
            <Text key={column.key} style={styles.columnHeader}>
              {column.label}
            </Text>
          ))}
        </View>

        {MODULE_ROWS.map((row) => (
          <View key={row.key} style={styles.moduleBlock}>
            <View style={styles.matrixRow}>
              <Text style={styles.moduleLabel}>{row.label}</Text>
              {CRUD_COLUMNS.map((column) => renderCrudCell(row.key, column.key))}
            </View>
            {row.hint ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: { gap: 8 },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700',
      marginTop: 4,
    },
    hint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(17),
      marginBottom: 4,
    },
    empty: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      marginBottom: 4,
    },
    chipRow: { gap: 8, paddingVertical: 4 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      maxWidth: 160,
    },
    chipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '22',
    },
    chipText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600',
    },
    chipTextSelected: {
      color: theme.colors.primary,
    },
    generalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    generalLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '600',
    },
    matrixCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      overflow: 'hidden',
    },
    matrixHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    moduleHeader: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    columnHeader: {
      width: 34,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(9),
      fontWeight: '700',
    },
    moduleBlock: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    matrixRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 3,
    },
    moduleLabel: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600',
      paddingRight: 4,
    },
    rowHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
      paddingHorizontal: 10,
      paddingBottom: 8,
      marginTop: -4,
    },
    crudCell: {
      width: 34,
      height: 26,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    crudCellOn: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '18',
    },
    crudCellEmpty: {
      width: 7,
      height: 7,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
  };
}
