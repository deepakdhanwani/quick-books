import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { api } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { exportLedger } from '../utils/exportLedger';
import type { PdfCompanyInfo } from '../utils/pdfDocument';
import {
  createLedgerExportPeriod,
  defaultLedgerExportPeriod,
  financialYearLabel,
  LedgerExportPeriod,
  LedgerExportPeriodMode,
  ledgerExportPeriodCaption,
  recentFinancialYearOptions,
  recentMonthYearOptions,
  resolveLedgerExportPeriod,
} from '../utils/exportPeriod';
import { fetchAllPartyLedgerEntries } from '../utils/fetchPartyLedger';
import {
  defaultLedgerExportScope,
  ledgerScopeOptions,
  prepareLedgerEntriesForExport,
  type LedgerExportScope,
} from '../utils/ledgerExportScope';
import type { LedgerPartyMode } from '../utils/partyLedger';
import { ExportingOverlay } from './ExportingOverlay';

type LedgerExportModalProps = {
  visible: boolean;
  token: string;
  mode: LedgerPartyMode;
  partyId: number;
  partyName: string;
  businessName?: string;
  pdfCompany?: PdfCompanyInfo;
  onClose: () => void;
};

const PERIOD_MODES: { id: LedgerExportPeriodMode; label: string }[] = [
  { id: 'monthYear', label: 'Month' },
  { id: 'financialYear', label: 'FY' },
  { id: 'customRange', label: 'Custom' },
];

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  styles,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            style={[styles.chip, selected && styles.chipActive]}
            onPress={() => onChange(option.id)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LedgerExportModal({
  visible,
  token,
  mode,
  partyId,
  partyName,
  businessName,
  pdfCompany,
  onClose,
}: LedgerExportModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [period, setPeriod] = useState<LedgerExportPeriod>(defaultLedgerExportPeriod());
  const [scope, setScope] = useState<LedgerExportScope>(defaultLedgerExportScope());
  const [exporting, setExporting] = useState(false);

  const scopeOptions = useMemo(
    () =>
      ledgerScopeOptions(mode).map((option) => ({
        id: option.id,
        label:
          option.id === 'all'
            ? 'Ledger'
            : option.id === 'documents'
              ? mode === 'customer'
                ? 'Invoices'
                : 'Bills'
              : 'Payments',
      })),
    [mode],
  );
  const monthYearOptions = useMemo(() => recentMonthYearOptions(12), []);
  const financialYearOptions = useMemo(() => recentFinancialYearOptions(6), []);
  const periodCaption = ledgerExportPeriodCaption(period);

  useEffect(() => {
    if (!visible) return;
    setPeriod(defaultLedgerExportPeriod());
    setScope(defaultLedgerExportScope());
    setExporting(false);
  }, [visible]);

  const handleExport = async () => {
    try {
      resolveLedgerExportPeriod(period);
    } catch (err) {
      appAlert('Invalid period', err instanceof Error ? err.message : 'Check the selected period');
      return;
    }

    setExporting(true);
    try {
      const { fromDate, toDate } = resolveLedgerExportPeriod(period);
      const [entries, summary] = await Promise.all([
        fetchAllPartyLedgerEntries(token, mode, partyId, fromDate, toDate),
        mode === 'customer'
          ? api.getCustomerAccountSummary(token, partyId)
          : api.getVendorAccountSummary(token, partyId),
      ]);
      const preparedEntries = prepareLedgerEntriesForExport(
        entries,
        mode,
        scope,
        summary.openingBalance ?? 0,
      );
      const hasOpening =
        scope === 'all' &&
        ((summary.openingDebit ?? 0) > 0 || (summary.openingCredit ?? 0) > 0);
      if (preparedEntries.length === 0 && !hasOpening) {
        appAlert('No data', 'No ledger entries found for the selected period and export type.');
        return;
      }

      await exportLedger(
        {
          mode,
          partyName,
          company: pdfCompany,
          businessName,
          fromDate,
          toDate,
          scope,
          entries: preparedEntries,
          openingDebit: summary.openingDebit,
          openingCredit: summary.openingCredit,
          openingBalance: summary.openingBalance,
        },
        { token, onPdfReady: () => setExporting(false) },
      );
      onClose();
    } catch (err) {
      appAlert('Export failed', err instanceof Error ? err.message : 'Could not export ledger');
    } finally {
      setExporting(false);
    }
  };

  const renderPeriodDetail = () => {
    if (period.mode === 'monthYear') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}
        >
          {monthYearOptions.map((option) => {
            const selected = period.month === option.month && period.year === option.year;
            return (
              <Pressable
                key={`${option.year}-${option.month}`}
                style={[styles.miniChip, selected && styles.miniChipActive]}
                onPress={() =>
                  setPeriod({ mode: 'monthYear', month: option.month, year: option.year })
                }
              >
                <Text style={[styles.miniChipText, selected && styles.miniChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    if (period.mode === 'financialYear') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}
        >
          {financialYearOptions.map((year) => {
            const selected = period.financialYearStart === year;
            return (
              <Pressable
                key={year}
                style={[styles.miniChip, selected && styles.miniChipActive]}
                onPress={() => setPeriod({ mode: 'financialYear', financialYearStart: year })}
              >
                <Text style={[styles.miniChipText, selected && styles.miniChipTextActive]}>
                  {financialYearLabel(year)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    return (
      <View style={styles.rangeRow}>
        <View style={styles.rangeField}>
          <Text style={styles.inputLabel}>From</Text>
          <TextInput
            style={styles.dateInput}
            value={period.fromDate ?? ''}
            onChangeText={(fromDate) => setPeriod((current) => ({ ...current, mode: 'customRange', fromDate }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.rangeField}>
          <Text style={styles.inputLabel}>To</Text>
          <TextInput
            style={styles.dateInput}
            value={period.toDate ?? ''}
            onChangeText={(toDate) => setPeriod((current) => ({ ...current, mode: 'customRange', toDate }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
          />
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal visible={visible && !exporting} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Export Ledger</Text>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Text style={styles.sectionLabel}>What to export</Text>
              <ChipRow
                options={scopeOptions}
                value={scope}
                onChange={setScope}
                styles={styles}
              />

              <Text style={styles.sectionLabel}>Period</Text>
              <ChipRow
                options={PERIOD_MODES}
                value={period.mode}
                onChange={(modeId) => setPeriod(createLedgerExportPeriod(modeId))}
                styles={styles}
              />

              <View style={styles.periodDetail}>{renderPeriodDetail()}</View>
              <Text style={styles.caption}>{periodCaption}</Text>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.primaryButton} onPress={() => void handleExport()}>
                <Ionicons name="share-outline" size={18} color={theme.colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Export PDF</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ExportingOverlay visible={exporting} />
    </>
  );
}

function createStyles(theme: AppTheme) {
  return {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 20, 25, 0.55)',
      justifyContent: 'flex-end' as const,
      padding: 12,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: '78%' as const,
      overflow: 'hidden' as const,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(17),
      fontWeight: '700' as const,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    body: {
      flexGrow: 0,
      flexShrink: 1,
    },
    bodyContent: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    sectionLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      marginBottom: 6,
      marginTop: 10,
    },
    chipRow: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    chip: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center' as const,
    },
    chipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    chipText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    chipTextActive: {
      color: theme.colors.primary,
    },
    periodDetail: {
      marginTop: 8,
      minHeight: 44,
      justifyContent: 'center' as const,
    },
    hScrollContent: {
      gap: 8,
      paddingVertical: 2,
    },
    miniChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    miniChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    miniChipText: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    miniChipTextActive: {
      color: theme.colors.primary,
    },
    rangeRow: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    rangeField: {
      flex: 1,
    },
    inputLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
      marginBottom: 4,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      backgroundColor: theme.colors.background,
    },
    caption: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      marginTop: 6,
      marginBottom: 4,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      backgroundColor: theme.colors.surface,
    },
    primaryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
    },
    cancelButton: {
      marginTop: 8,
      alignItems: 'center' as const,
      paddingVertical: 6,
    },
    cancelText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
    },
  };
}
