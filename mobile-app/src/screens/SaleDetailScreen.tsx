import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Sale, SaleItem } from '../services/api';
import { colors } from '../theme/colors';
import {
  formatCurrency,
  formatDate,
  getPaymentModeLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/saleAmounts';

type SaleDetailScreenProps = {
  token: string;
  saleId: number;
  onEdit: () => void;
  onReceivePayment: () => void;
};

export function SaleDetailScreen({ token, saleId, onEdit, onReceivePayment }: SaleDetailScreenProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSale = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) setLoading(true);
      setError('');
      try {
        const data = await api.getSale(token, saleId);
        setSale(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load sale');
      } finally {
        setLoading(false);
      }
    },
    [saleId, token],
  );

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  if (loading && !sale) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error || 'Sale not found'}</Text>
      </View>
    );
  }

  const statusColor = getPaymentStatusColor(sale.paymentStatus);
  const canReceivePayment = sale.paymentStatus !== 'PAID';
  const canEdit = sale.paymentStatus !== 'PAID';

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await loadSale(true);
        setRefreshing(false);
      }}
    >
      <Card style={styles.headerCard}>
        <Text style={styles.invoice}>{sale.invoiceNumber ?? `Sale #${sale.id}`}</Text>
        <Text style={styles.customer}>{sale.customerName}</Text>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getPaymentStatusLabel(sale.paymentStatus)}
          </Text>
        </View>
      </Card>

      {sale.items && sale.items.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Products</Text>
          {sale.items.map((item) => (
            <SaleProductLine key={item.id} item={item} />
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Invoice</Text>
        <DetailRow label="Date" value={formatDate(sale.date)} />
        <DetailRow label="Gross Amount" value={formatCurrency(sale.grossAmount)} />
        <DetailRow label="Discount" value={formatCurrency(sale.discountAmount)} />
        <DetailRow label="Tax %" value={sale.taxPercent != null ? `${sale.taxPercent}%` : '—'} />
        <DetailRow label="Tax Amount" value={formatCurrency(sale.taxAmount)} />
        <DetailRow label="Net Amount" value={formatCurrency(sale.netAmount)} highlight />
        <DetailRow label="Paid" value={formatCurrency(sale.paidAmount)} />
        <DetailRow label="Pending" value={formatCurrency(sale.pendingAmount)} highlight />
        {sale.notes ? <DetailRow label="Notes" value={sale.notes} /> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Payments Received</Text>
        {sale.payments && sale.payments.length > 0 ? (
          sale.payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
              </View>
              <Text style={styles.paymentMeta}>
                {getPaymentModeLabel(payment.paymentMode)}
                {payment.paymentDetails ? ` · ${payment.paymentDetails}` : ''}
              </Text>
              {payment.hasProof ? (
                <View style={styles.proofRow}>
                  <Ionicons name="attach-outline" size={16} color={colors.primary} />
                  <Text style={styles.proofText}>{payment.proofFileName ?? 'Payment proof attached'}</Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyPayments}>No payments received yet.</Text>
        )}
      </Card>

      {canEdit ? <Button title="Edit Sale" onPress={onEdit} /> : null}

      {canReceivePayment ? (
        <Button title="Receive Payment" onPress={onReceivePayment} />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RefreshableScrollView>
  );
}

function SaleProductLine({ item }: { item: SaleItem }) {
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
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerCard: { alignItems: 'center', paddingVertical: 24 },
  invoice: { color: colors.text, fontSize: 22, fontWeight: '700' },
  customer: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  itemName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  itemMeta: { color: colors.textSecondary, fontSize: 12 },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  priceCell: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  priceValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  priceNet: { color: colors.primary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { color: colors.textSecondary, fontSize: 13 },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  detailValueHighlight: { color: colors.primary },
  paymentCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentAmount: { color: colors.text, fontSize: 16, fontWeight: '700' },
  paymentDate: { color: colors.textSecondary, fontSize: 12 },
  paymentMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  proofText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  emptyPayments: { color: colors.textSecondary, fontStyle: 'italic' },
  error: { color: colors.error, textAlign: 'center' },
});
