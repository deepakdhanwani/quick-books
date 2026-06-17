import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ExportingOverlay } from '../components/ExportingOverlay';
import { ExportPdfButton } from '../components/ExportPdfButton';
import { PaymentProofLink } from '../components/PaymentProofLink';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Purchase, PurchaseItem } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { exportPurchaseDocument } from '../utils/exportPurchaseDocument';
import type { PdfCompanyInfo } from '../utils/pdfDocument';
import {
  formatCurrency,
  formatDate,
  getPaymentModeLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';

type PurchaseDetailScreenProps = {
  token: string;
  purchaseId: number;
  businessName?: string;
  pdfCompany?: PdfCompanyInfo;
  onEdit: () => void;
  onMakePayment: () => void;
  canEdit?: boolean;
};

export function PurchaseDetailScreen({
  token,
  purchaseId,
  businessName,
  pdfCompany,
  onEdit,
  onMakePayment,
  canEdit: canEditPermission = true,
}: PurchaseDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadPurchase = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) setLoading(true);
      setError('');
      try {
        const data = await api.getPurchase(token, purchaseId);
        setPurchase(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load purchase');
      } finally {
        setLoading(false);
      }
    },
    [purchaseId, token],
  );

  useEffect(() => {
    loadPurchase();
  }, [loadPurchase]);

  if (loading && !purchase) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!purchase) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error || 'Purchase not found'}</Text>
      </View>
    );
  }

  const statusColor = getPaymentStatusColor(purchase.paymentStatus);
  const canEditPurchase = canEditPermission && purchase.paymentStatus !== 'PAID';
  const canMakePayment = canEditPermission && purchase.paymentStatus !== 'PAID';

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportPurchaseDocument(
        { purchase, company: pdfCompany, businessName },
        { token, onPdfReady: () => setExporting(false) },
      );
    } catch (err) {
      appAlert('Export failed', err instanceof Error ? err.message : 'Could not export purchase order');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await loadPurchase(true);
        setRefreshing(false);
      }}
    >
      <Card style={styles.headerCard}>
        <Text style={styles.billNumber}>{purchase.billNumber ?? `Purchase #${purchase.id}`}</Text>
        <Text style={styles.vendor}>{purchase.vendorName}</Text>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getPaymentStatusLabel(purchase.paymentStatus)}
          </Text>
        </View>
      </Card>

      <ExportPdfButton
        label="Export purchase order"
        onPress={() => void handleExport()}
        disabled={exporting}
      />

      {purchase.items && purchase.items.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Products</Text>
          {purchase.items.map((item) => (
            <PurchaseProductLine key={item.id} item={item} />
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Bill</Text>
        <DetailRow label="Date" value={formatDate(purchase.date)} />
        <DetailRow label="Gross Amount" value={formatCurrency(purchase.grossAmount)} />
        <DetailRow label="Discount" value={formatCurrency(purchase.discountAmount)} />
        <DetailRow
          label="Tax %"
          value={purchase.taxPercent != null ? `${purchase.taxPercent}%` : '—'}
        />
        <DetailRow label="Tax Amount" value={formatCurrency(purchase.taxAmount)} />
        <DetailRow label="Net Amount" value={formatCurrency(purchase.netAmount)} highlight />
        <DetailRow label="Paid" value={formatCurrency(purchase.paidAmount)} />
        <DetailRow label="Pending" value={formatCurrency(purchase.pendingAmount)} highlight />
        {purchase.adjustedAmount != null && purchase.adjustedAmount > 0 ? (
          <DetailRow label="Adjusted" value={formatCurrency(purchase.adjustedAmount)} />
        ) : null}
        {purchase.notes ? <DetailRow label="Notes" value={purchase.notes} /> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Payments Made</Text>
        {purchase.payments && purchase.payments.length > 0 ? (
          purchase.payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
              </View>
              <Text style={styles.paymentMeta}>
                {getPaymentModeLabel(payment.paymentMode)}
                {payment.paymentDetails ? ` · ${payment.paymentDetails}` : ''}
              </Text>
              {payment.settlementType === 'SETTLEMENT' &&
              payment.adjustedAmount != null &&
              payment.adjustedAmount > 0 ? (
                <Text style={styles.adjustedMeta}>
                  Settled with {formatCurrency(payment.adjustedAmount)} adjusted
                </Text>
              ) : null}
              {payment.hasProof ? (
                <PaymentProofLink
                  token={token}
                  proofUrl={api.getPurchasePaymentProofUrl(payment.id)}
                  fileName={payment.proofFileName}
                />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyPayments}>No payments made yet.</Text>
        )}
      </Card>

      {canEditPurchase ? <Button title="Edit Purchase" onPress={onEdit} /> : null}

      {canMakePayment ? <Button title="Make Payment" onPress={onMakePayment} /> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      </RefreshableScrollView>
      <ExportingOverlay visible={exporting} message="Preparing purchase PDF..." />
    </View>
  );
}

function PurchaseProductLine({ item }: { item: PurchaseItem }) {
  const styles = useThemedStyles(createStyles);

  const qty = item.quantity;
  const unitDiscount = item.discount ?? 0;
  const lineGross = item.unitPrice * qty;
  const lineDiscount = unitDiscount * qty;
  const lineNet = item.amount;

  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemName}>{item.productName ?? item.description}</Text>
      <Text style={styles.itemMeta}>
        Qty {qty} · {formatCurrency(item.unitPrice)} each
        {unitDiscount > 0 ? ` · Disc ${formatCurrency(unitDiscount)} each` : ''}
      </Text>
      <View style={styles.priceGrid}>
        <View style={styles.priceCell}>
          <Text style={styles.priceLabel}>Gross</Text>
          <Text style={styles.priceValue}>{formatCurrency(lineGross)}</Text>
        </View>
        <View style={styles.priceCell}>
          <Text style={styles.priceLabel}>Discount</Text>
          <Text style={styles.priceValue}>
            {lineDiscount > 0 ? formatCurrency(lineDiscount) : '—'}
          </Text>
        </View>
        <View style={styles.priceCell}>
          <Text style={styles.priceLabel}>Net</Text>
          <Text style={[styles.priceValue, styles.priceNet]}>{formatCurrency(lineNet)}</Text>
        </View>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
        {value || '—'}
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerCard: { alignItems: 'center', paddingVertical: 24 },
  billNumber: { color: theme.colors.text, fontSize: theme.scaleFont(22), fontWeight: '700' },
  vendor: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(15), marginTop: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceElevated,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: theme.scaleFont(13), fontWeight: '600' },
  sectionTitle: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '700', marginBottom: 8 },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 6,
  },
  itemName: { color: theme.colors.text, fontSize: theme.scaleFont(14), fontWeight: '600' },
  itemMeta: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12) },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  priceCell: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  priceLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(10),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  priceValue: { color: theme.colors.text, fontSize: theme.scaleFont(13), fontWeight: '600' },
  priceNet: { color: theme.colors.primary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13) },
  detailValue: { color: theme.colors.text, fontSize: theme.scaleFont(14), fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  detailValueHighlight: { color: theme.colors.primary },
  paymentCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentAmount: { color: theme.colors.text, fontSize: theme.scaleFont(16), fontWeight: '700' },
  paymentDate: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12) },
  paymentMeta: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13), marginTop: 4 },
  adjustedMeta: { color: theme.colors.warning, fontSize: theme.scaleFont(12), marginTop: 4, fontWeight: '500' },
  emptyPayments: { color: theme.colors.textSecondary, fontStyle: 'italic' },
  error: { color: theme.colors.error, textAlign: 'center' },

  };
}
