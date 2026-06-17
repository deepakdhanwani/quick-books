import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { PartyLedgerEntry } from '../services/api';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { LedgerPartyMode } from '../utils/partyLedger';
import { formatCurrency, formatDate } from '../utils/saleAmounts';

type LedgerPanelProps = {
  mode: LedgerPartyMode;
  entries: PartyLedgerEntry[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string;
  onOpenReference?: (referenceId: number) => void;
};

function entryVisual(kind: string, theme: AppTheme) {
  switch (kind) {
    case 'INVOICE':
      return { icon: 'receipt-outline' as const, color: theme.colors.warning };
    case 'BILL':
      return { icon: 'document-text-outline' as const, color: theme.colors.warning };
    case 'PAYMENT_IN':
      return { icon: 'arrow-down-circle-outline' as const, color: theme.colors.success };
    case 'PAYMENT_OUT':
      return { icon: 'arrow-up-circle-outline' as const, color: theme.colors.primary };
    default:
      return { icon: 'ellipse-outline' as const, color: theme.colors.textSecondary };
  }
}

function formatLedgerAmount(value: number) {
  return value > 0 ? formatCurrency(value) : '—';
}

export function LedgerTableHeader({ mode }: { mode: LedgerPartyMode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
      <Text style={[styles.headerCell, styles.particularsCol]}>Particulars</Text>
      <Text style={[styles.headerCell, styles.amountCol]}>Debit</Text>
      <Text style={[styles.headerCell, styles.amountCol]}>Credit</Text>
      <Text style={[styles.headerCell, styles.balanceCol]}>Balance</Text>
      <Text style={styles.modeHint}>
        {mode === 'customer' ? 'Newest first' : 'Newest first'}
      </Text>
    </View>
  );
}

export function LedgerOpeningRow({
  openingDebit = 0,
  openingCredit = 0,
  openingBalance = 0,
}: {
  openingDebit?: number;
  openingCredit?: number;
  openingBalance?: number;
}) {
  const styles = useThemedStyles(createStyles);
  const hasOpening = openingDebit > 0 || openingCredit > 0;

  return (
    <View style={styles.openingRow}>
      <Text style={[styles.openingText, styles.dateCol]}>—</Text>
      <Text style={[styles.openingText, styles.particularsCol]}>Opening balance</Text>
      <Text style={[styles.openingText, styles.amountCol]}>
        {hasOpening ? formatLedgerAmount(openingDebit) : '—'}
      </Text>
      <Text style={[styles.openingText, styles.amountCol]}>
        {hasOpening ? formatLedgerAmount(openingCredit) : '—'}
      </Text>
      <Text style={[styles.openingText, styles.balanceCol]}>{formatCurrency(openingBalance)}</Text>
    </View>
  );
}

export function LedgerEntryRow({
  entry,
  mode,
  index,
  onPress,
}: {
  entry: PartyLedgerEntry;
  mode: LedgerPartyMode;
  index: number;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const visual = entryVisual(entry.kind, theme);
  const isPayment = entry.kind === 'PAYMENT_IN' || entry.kind === 'PAYMENT_OUT';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.dataRow,
        index % 2 === 1 && styles.dataRowAlt,
        pressed && styles.dataRowPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.dataCell, styles.dateCol]}>{formatDate(entry.date)}</Text>

      <View style={[styles.particularsCol, styles.particularsCell]}>
        <View style={[styles.kindIcon, { backgroundColor: `${visual.color}18` }]}>
          <Ionicons name={visual.icon} size={14} color={visual.color} />
        </View>
        <View style={styles.particularsText}>
          <Text style={styles.particularsTitle} numberOfLines={2}>
            {entry.particulars}
          </Text>
          <Text style={styles.particularsMeta} numberOfLines={1}>
            {isPayment ? 'Payment' : mode === 'customer' ? 'Invoice' : 'Bill'} · {entry.referenceLabel}
          </Text>
        </View>
      </View>

      <Text style={[styles.dataCell, styles.amountCol, styles.debitText]}>
        {formatLedgerAmount(entry.debit)}
      </Text>
      <Text style={[styles.dataCell, styles.amountCol, styles.creditText]}>
        {formatLedgerAmount(entry.credit)}
      </Text>
      <Text
        style={[
          styles.dataCell,
          styles.balanceCol,
          styles.balanceText,
          entry.balance > 0 ? styles.balanceDue : styles.balanceClear,
        ]}
      >
        {formatCurrency(entry.balance)}
      </Text>
    </Pressable>
  );
}

export function LedgerPanel({
  mode,
  entries,
  loading = false,
  loadingMore = false,
  error,
  onOpenReference,
}: LedgerPanelProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (loading && entries.length === 0) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading ledger...</Text>
      </View>
    );
  }

  if (error && entries.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="alert-circle-outline" size={28} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="book-outline" size={30} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No ledger entries yet</Text>
        <Text style={styles.emptyHint}>
          {mode === 'customer'
            ? 'Sales and payments for this customer will appear here, newest first.'
            : 'Bills and payments for this vendor will appear here, newest first.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tableCard}>
      <LedgerTableHeader mode={mode} />
      {entries.map((entry, index) => (
        <LedgerEntryRow
          key={entry.id}
          entry={entry}
          mode={mode}
          index={index}
          onPress={() => onOpenReference?.(entry.referenceId)}
        />
      ))}
      <LedgerOpeningRow />
      {loadingMore ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.footerLoader} />
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    tableCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden' as const,
    },
    headerRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 4,
    },
    modeHint: {
      width: '100%' as const,
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
      marginTop: 2,
    },
    headerCell: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
    },
    openingRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: `${theme.colors.primary}08`,
    },
    openingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontStyle: 'italic' as const,
    },
    dataRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dataRowAlt: {
      backgroundColor: `${theme.colors.background}88`,
    },
    dataRowPressed: {
      opacity: 0.9,
    },
    dataCell: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(11),
    },
    dateCol: {
      width: 88,
    },
    particularsCol: {
      width: 220,
    },
    amountCol: {
      width: 78,
      textAlign: 'right' as const,
    },
    balanceCol: {
      width: 88,
      textAlign: 'right' as const,
    },
    particularsCell: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    kindIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    particularsText: {
      flex: 1,
      minWidth: 0,
    },
    particularsTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(12),
      fontWeight: '600' as const,
    },
    particularsMeta: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(10),
      marginTop: 2,
    },
    debitText: {
      color: theme.colors.warning,
      fontWeight: '700' as const,
    },
    creditText: {
      color: theme.colors.success,
      fontWeight: '700' as const,
    },
    balanceText: {
      fontWeight: '800' as const,
    },
    balanceDue: {
      color: theme.colors.warning,
    },
    balanceClear: {
      color: theme.colors.success,
    },
    loadingBox: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 36,
      gap: 10,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
    },
    emptyBox: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 8,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
      marginTop: 4,
    },
    emptyHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      lineHeight: theme.scaleFont(18),
      textAlign: 'center' as const,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(13),
      textAlign: 'center' as const,
    },
    footerLoader: {
      marginVertical: 14,
    },
  };
}
