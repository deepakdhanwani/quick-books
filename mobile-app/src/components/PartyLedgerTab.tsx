import { ReactNode, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import { Card } from './Card';
import {
  LedgerEntryRow,
  LedgerOpeningRow,
  LedgerTableHeader,
} from './LedgerPanel';
import { RefreshableScrollView } from './RefreshableScrollView';
import type { PartyLedgerEntry } from '../services/api';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { LedgerPartyMode } from '../utils/partyLedger';

const LEDGER_TABLE_MIN_WIDTH = 620;

type PartyLedgerTabProps = {
  mode: LedgerPartyMode;
  headerCard: ReactNode;
  tabBar: ReactNode;
  entries: PartyLedgerEntry[];
  loading: boolean;
  loadingMore: boolean;
  error?: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onLoadMore: () => void;
  onOpenReference: (referenceId: number) => void;
  onExport?: () => void;
  openingDebit?: number;
  openingCredit?: number;
  openingBalance?: number;
};

export function PartyLedgerTab({
  mode,
  headerCard,
  tabBar,
  entries,
  loading,
  loadingMore,
  error,
  refreshing,
  onRefresh,
  onLoadMore,
  onOpenReference,
  onExport,
  openingDebit = 0,
  openingCredit = 0,
  openingBalance = 0,
}: PartyLedgerTabProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const loadMoreGateRef = useRef(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (loadMoreGateRef.current) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

      if (distanceFromBottom < 140) {
        loadMoreGateRef.current = true;
        onLoadMore();
        setTimeout(() => {
          loadMoreGateRef.current = false;
        }, 600);
      }
    },
    [onLoadMore],
  );

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      nestedScrollEnabled
      showsVerticalScrollIndicator
    >
      {headerCard}
      {tabBar}
      {onExport ? (
        <Pressable style={styles.exportButton} onPress={onExport}>
          <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.exportButtonText}>Export ledger</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && entries.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
        </View>
      ) : null}

      {!loading && entries.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No ledger entries yet</Text>
          <Text style={styles.emptyHint}>
            {mode === 'customer'
              ? 'Sales and payments for this customer will appear here, newest first.'
              : 'Bills and payments for this vendor will appear here, newest first.'}
          </Text>
        </Card>
      ) : null}

      {entries.length > 0 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.horizontalContent}
        >
          <View style={[styles.tableCard, { minWidth: LEDGER_TABLE_MIN_WIDTH }]}>
            <LedgerTableHeader mode={mode} />
            {entries.map((entry, index) => (
              <LedgerEntryRow
                key={entry.id}
                entry={entry}
                mode={mode}
                index={index}
                onPress={() => onOpenReference(entry.referenceId)}
              />
            ))}
            <LedgerOpeningRow
              openingDebit={openingDebit}
              openingCredit={openingCredit}
              openingBalance={openingBalance}
            />
          </View>
        </ScrollView>
      ) : null}

      {loadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null}
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
    horizontalContent: {
      paddingBottom: 4,
    },
    tableCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden' as const,
    },
    loadingBox: {
      paddingVertical: 32,
      alignItems: 'center' as const,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontWeight: '700' as const,
      fontSize: theme.scaleFont(15),
    },
    emptyHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      marginTop: 6,
      lineHeight: theme.scaleFont(18),
    },
    exportButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      marginBottom: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    exportButtonText: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(14),
      fontWeight: '700' as const,
    },
    error: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: 'center' as const,
    },
    footerLoader: {
      marginTop: 16,
    },
  };
}
