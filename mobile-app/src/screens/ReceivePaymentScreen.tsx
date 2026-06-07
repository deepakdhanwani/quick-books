import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, PaymentMode, PaymentProofFile, Sale } from '../services/api';
import { colors } from '../theme/colors';
import { formatCurrency, getPaymentDetailsLabel, parseAmount } from '../utils/saleAmounts';

type ReceivePaymentScreenProps = {
  token: string;
  saleId: number;
  onSaved: () => void;
};

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'CASH', label: 'Cash', icon: 'cash-outline' },
  { value: 'UPI', label: 'UPI', icon: 'phone-portrait-outline' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'business-outline' },
];

export function ReceivePaymentScreen({ token, saleId, onSaved }: ReceivePaymentScreenProps) {
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
      type: ['image/*', 'application/pdf'],
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

  const handleSave = async () => {
    const paymentAmount = parseAmount(amount);
    if (paymentAmount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (!proof) {
      setError('Payment proof attachment is required');
      return;
    }
    if (sale && paymentAmount > sale.pendingAmount) {
      setError('Amount cannot exceed pending balance');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.receiveSalePayment(
        token,
        saleId,
        {
          amount: paymentAmount,
          paymentMode,
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading sale...</Text>
      </View>
    );
  }

  return (
    <RefreshableScrollView style={styles.container} contentContainerStyle={styles.content}>
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

        <Text style={styles.sectionLabel}>Payment Mode *</Text>
        <View style={styles.modeRow}>
          {PAYMENT_MODES.map((mode) => {
            const selected = paymentMode === mode.value;
            return (
              <Pressable
                key={mode.value}
                style={[styles.modeChip, selected && styles.modeChipActive]}
                onPress={() => setPaymentMode(mode.value)}
              >
                <Ionicons
                  name={mode.icon}
                  size={16}
                  color={selected ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.modeChipText, selected && styles.modeChipTextActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

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

        <Text style={styles.sectionLabel}>Payment Proof *</Text>
        <Pressable style={styles.proofPicker} onPress={pickProof}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
          <View style={styles.proofTextBlock}>
            <Text style={styles.proofTitle}>
              {proof ? proof.name : 'Upload receipt, screenshot, or PDF'}
            </Text>
            <Text style={styles.proofHint}>JPG, PNG, WEBP, or PDF up to 10 MB</Text>
          </View>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Record Payment" onPress={handleSave} loading={saving} />
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary },
  summary: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 13 },
  summaryValue: { color: colors.primary, fontSize: 24, fontWeight: '700', marginTop: 4 },
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  modeChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  modeChipTextActive: { color: colors.primary, fontWeight: '600' },
  proofPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceElevated,
    marginBottom: 16,
  },
  proofTextBlock: { flex: 1 },
  proofTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  proofHint: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  error: { color: colors.error, marginBottom: 12 },
});
