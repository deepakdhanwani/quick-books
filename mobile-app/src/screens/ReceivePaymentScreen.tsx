import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../theme/AppThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PaymentModePicker } from '../components/PaymentModePicker';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, PaymentMode, PaymentProofFile, Sale } from '../services/api';
import { PAYMENT_PROOF_PICKER_TYPES } from '../utils/paymentProofFiles';
import { resolvePaymentSettlementType } from '../utils/paymentSettlement';
import { formatCurrency, getPaymentDetailsLabel, parseAmount } from '../utils/saleAmounts';

type ReceivePaymentScreenProps = {
  token: string;
  saleId: number;
  onSaved: () => void;
};

export function ReceivePaymentScreen({ token, saleId, onSaved }: ReceivePaymentScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [sale, setSale] = useState<Sale | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<PaymentProofFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSale = async () => {
      try {
        const data = await api.getSale(token, saleId);
        setSale(data);
        setAmount(String(data.pendingAmount ?? ''));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load sale');
      } finally {
        setLoading(false);
      }
    };
    loadSale();
  }, [saleId, token]);

  const pickProof = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...PAYMENT_PROOF_PICKER_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setProof({
      uri: asset.uri,
      name: asset.name ?? 'payment-proof',
      mimeType: asset.mimeType ?? 'application/octet-stream',
    });
  };

  const submitPayment = async (settlementType: 'FULL' | 'PARTIAL' | 'SETTLEMENT') => {
    const paymentAmount = parseAmount(amount);

    setSaving(true);
    setError('');
    try {
      await api.receiveSalePayment(
        token,
        saleId,
        {
          amount: paymentAmount,
          paymentMode,
          settlementType,
          paymentDetails: paymentDetails.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        proof,
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const paymentAmount = parseAmount(amount);
    if (paymentAmount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (sale && paymentAmount > sale.pendingAmount) {
      setError('Amount cannot exceed pending balance');
      return;
    }

    setError('');
    resolvePaymentSettlementType({
      paymentAmount,
      pendingAmount: sale?.pendingAmount ?? 0,
      documentLabel: 'invoice',
      onChoose: submitPayment,
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading sale...</Text>
      </View>
    );
  }

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={false}
      onRefresh={async () => {}}
    >
      <Card>
        {sale ? (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Pending Balance</Text>
            <Text style={styles.summaryValue}>{formatCurrency(sale.pendingAmount)}</Text>
          </View>
        ) : null}

        <Input
          label="Payment Amount *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <PaymentModePicker value={paymentMode} onChange={setPaymentMode} />

        <Input
          label={getPaymentDetailsLabel(paymentMode)}
          value={paymentDetails}
          onChangeText={setPaymentDetails}
          placeholder={
            paymentMode === 'UPI'
              ? 'e.g. UPI reference or transaction ID'
              : paymentMode === 'BANK_TRANSFER'
                ? 'e.g. NEFT/IMPS reference number'
                : 'Optional cash reference'
          }
        />
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />

        <Text style={styles.sectionLabel}>Payment Proof (optional)</Text>
        <Pressable style={styles.proofPicker} onPress={pickProof}>
          <Ionicons name="cloud-upload-outline" size={22} color={theme.colors.primary} />
          <View style={styles.proofTextBlock}>
            <Text style={styles.proofTitle}>
              {proof ? proof.name : 'Upload receipt, screenshot, or PDF'}
            </Text>
            <Text style={styles.proofHint}>Image, PDF, Word, or Excel — optional</Text>
          </View>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Record Payment" onPress={handleSave} loading={saving} />
      </Card>
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textSecondary },
  summary: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13) },
  summaryValue: { color: theme.colors.primary, fontSize: theme.scaleFont(24), fontWeight: '700', marginTop: 4 },
  sectionLabel: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },
  proofPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surfaceElevated,
    marginBottom: 16,
  },
  proofTextBlock: { flex: 1 },
  proofTitle: { color: theme.colors.text, fontSize: theme.scaleFont(14), fontWeight: '600' },
  proofHint: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12), marginTop: 2 },
  error: { color: theme.colors.error, marginBottom: 12 },

  };
}
