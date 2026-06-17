import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { api } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { exportLedger } from '../utils/exportLedger';
import {
  defaultLedgerExportPeriod,
  financialYearLabel,
  LedgerExportPeriod,
  LedgerExportPeriodMode,
  recentFinancialYearOptions,
  recentMonthYearOptions,
  resolveLedgerExportPeriod,
  todayIso,
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
  onClose: () => void;
};

const PERIOD_OPTIONS: { id: LedgerExportPeriodMode; label: string; hint: string }[] = [
  { id: 'monthYear', label: 'Month & Year', hint: 'Pick a calendar month' },
  { id: 'financialYear', label: 'Financial Year', hint: 'Apr to Mar (India FY)' },
  { id: 'customRange', label: 'Custom Range', hint: 'Choose start and end dates' },
];

export function LedgerExportModal({
  visible,
  token,
  mode,
  partyId,
  partyName,
  businessName,
  onClose,
}: LedgerExportModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [period, setPeriod] = useState<LedgerExportPeriod>(defaultLedgerExportPeriod());
  const [scope, setScope] = useState<LedgerExportScope>(defaultLedgerExportScope());
  const [exporting, setExporting] = useState(false);
  const scopeOptions = ledgerScopeOptions(mode);

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
          businessName,
          fromDate,
          toDate,
          scope,
          entries: preparedEntries,
          openingDebit: summary.openingDebit,
          openingCredit: summary.openingCredit,
          openingBalance: summary.openingBalance,
        },
        { onPdfReady: () => setExporting(false) },
      );
      onClose();
    } catch (err) {
      appAlert('Export failed', err instanceof Error ? err.message : 'Could not export ledger');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Modal visible={visible && !exporting} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Export Ledger</Text>
            <Text style={styles.subtitle}>
              Choose what to include and the period, then share the ledger PDF via WhatsApp, email, or any app.
            </Text>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Export type</Text>
              <View style={styles.scopeList}>
                {scopeOptions.map((option) => {
                  const selected = scope === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.scopeItem, selected && styles.scopeItemActive]}
                      onPress={() => setScope(option.id)}
                    >
                      <Text style={[styles.scopeTitle, selected && styles.scopeTitleActive]}>
                        {option.label}
                      </Text>
                      <Text style={styles.scopeHint}>{option.hint}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Period</Text>
              <View style={styles.periodRow}>
                {PERIOD_OPTIONS.map((option) => {
                  const selected = period.mode === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.periodChip, selected && styles.periodChipActive]}
                      onPress={() =>
                        setPeriod((current) => ({
                          ...current,
                          mode: option.id,
                          fromDate: option.id === 'customRange' ? todayIso() : current.fromDate,
                          toDate: option.id === 'customRange' ? todayIso() : current.toDate,
                        }))
                      }
                    >
                      <Text style={[styles.periodChipText, selected && styles.periodChipTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {period.mode === 'monthYear' ? (
                <View style={styles.pickerList}>
                  {recentMonthYearOptions(18).map((option) => {
                    const selected = period.month === option.month && period.year === option.year;
                    return (
                      <Pressable
                        key={`${option.year}-${option.month}`}
                        style={[styles.pickerItem, selected && styles.pickerItemActive]}
                        onPress={() =>
                          setPeriod({ mode: 'monthYear', month: option.month, year: option.year })
                        }
                      >
                        <Text style={[styles.pickerItemText, selected && styles.pickerItemTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {period.mode === 'financialYear' ? (
                <View style={styles.pickerList}>
                  {recentFinancialYearOptions(8).map((year) => {
                    const selected = period.financialYearStart === year;
                    return (
                      <Pressable
                        key={year}
                        style={[styles.pickerItem, selected && styles.pickerItemActive]}
                        onPress={() => setPeriod({ mode: 'financialYear', financialYearStart: year })}
                      >
                        <Text style={[styles.pickerItemText, selected && styles.pickerItemTextActive]}>
                          {financialYearLabel(year)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {period.mode === 'customRange' ? (
                <View style={styles.rangeRow}>
                  <View style={styles.rangeField}>
                    <Text style={styles.inputLabel}>From</Text>
                    <TextInput
                      style={styles.input}
                      value={period.fromDate ?? ''}
                      onChangeText={(fromDate) => setPeriod((current) => ({ ...current, fromDate }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textSecondary}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.rangeField}>
                    <Text style={styles.inputLabel}>To</Text>
                    <TextInput
                      style={styles.input}
                      value={period.toDate ?? ''}
                      onChangeText={(toDate) => setPeriod((current) => ({ ...current, toDate }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textSecondary}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <Pressable style={styles.primaryButton} onPress={() => void handleExport()}>
              <Ionicons name="share-outline" size={18} color={theme.colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Export PDF</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
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
      padding: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: '88%' as const,
    },
    scroll: {
      maxHeight: 360,
      marginBottom: 14,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(18),
      fontWeight: '700' as const,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
      marginBottom: 14,
    },
    sectionLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
      marginTop: 4,
    },
    scopeList: {
      gap: 8,
      marginBottom: 14,
    },
    scopeItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    scopeItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    scopeTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
      marginBottom: 2,
    },
    scopeTitleActive: {
      color: theme.colors.primary,
    },
    scopeHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      lineHeight: theme.scaleFont(16),
    },
    periodRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      marginBottom: 14,
    },
    periodChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    periodChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    periodChipText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    periodChipTextActive: {
      color: theme.colors.primary,
    },
    pickerList: {
      gap: 8,
      marginBottom: 8,
    },
    pickerItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    pickerItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    pickerItemText: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
    },
    pickerItemTextActive: {
      color: theme.colors.primary,
      fontWeight: '700' as const,
    },
    rangeRow: {
      flexDirection: 'row' as const,
      gap: 10,
    },
    rangeField: {
      flex: 1,
      gap: 6,
    },
    inputLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      fontSize: theme.scaleFont(14),
    },
    primaryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
    },
    cancelButton: {
      marginTop: 12,
      alignItems: 'center' as const,
      paddingVertical: 10,
    },
    cancelText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
    },
  };
}
