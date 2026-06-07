import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CustomerAutocomplete } from '../components/CustomerAutocomplete';
import { Input } from '../components/Input';
import { ProductAutocomplete } from '../components/ProductAutocomplete';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Customer, Product } from '../services/api';
import { colors } from '../theme/colors';
import { calculateLineAmount, calculateLinesTotals } from '../utils/productAmounts';
import {
  calculateNetAmount,
  calculateTaxAmount,
  formatCurrency,
  parseAmount,
} from '../utils/saleAmounts';

type SaleFormScreenProps = {
  token: string;
  onSaved: () => void;
};

type AmountMode = 'manual' | 'products';

type ProductLine = {
  key: string;
  product: Product | null;
  quantity: string;
};

function createLine(): ProductLine {
  return { key: String(Date.now()) + Math.random(), product: null, quantity: '1' };
}

export function SaleFormScreen({ token, onSaved }: SaleFormScreenProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amountMode, setAmountMode] = useState<AmountMode>('manual');
  const [productLines, setProductLines] = useState<ProductLine[]>([createLine()]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxEdited, setTaxEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [error, setError] = useState('');
  const [customerError, setCustomerError] = useState('');
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadDefaults = async () => {
      setLoadingDefaults(true);
      try {
        const [profile, nextInvoice] = await Promise.all([
          api.getAccountProfile(token),
          api.getNextInvoiceNumber(token),
        ]);
        if (cancelled) return;

        setInvoiceNumber(nextInvoice.invoiceNumber);
        if (profile.defaultTaxPercent != null) {
          setTaxPercent(String(profile.defaultTaxPercent));
        }
      } catch {
        if (!cancelled) {
          setError('Could not load sale defaults');
        }
      } finally {
        if (!cancelled) {
          setLoadingDefaults(false);
        }
      }
    };

    loadDefaults();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const parsedLines = useMemo(
    () =>
      productLines
        .filter((line) => line.product != null)
        .map((line) => ({
          product: line.product as Product,
          quantity: parseAmount(line.quantity) || 0,
        })),
    [productLines],
  );

  const productTotals = useMemo(() => calculateLinesTotals(parsedLines), [parsedLines]);

  const gross = amountMode === 'products' ? productTotals.gross : parseAmount(grossAmount);
  const discount = amountMode === 'products' ? productTotals.discount : parseAmount(discountAmount);
  const percent = parseAmount(taxPercent);

  const calculatedTax = useMemo(
    () => calculateTaxAmount(gross, discount, percent),
    [gross, discount, percent],
  );
  const effectiveTax = taxEdited ? parseAmount(taxAmount) : calculatedTax;
  const netAmount = useMemo(
    () => calculateNetAmount(gross, discount, effectiveTax),
    [gross, discount, effectiveTax],
  );

  useEffect(() => {
    if (amountMode === 'products' && !taxEdited) {
      const nextTax = calculateTaxAmount(productTotals.gross, productTotals.discount, percent);
      setTaxAmount(nextTax > 0 ? String(nextTax) : '');
    }
  }, [amountMode, productTotals.discount, productTotals.gross, percent, taxEdited]);

  const handleTaxPercentChange = (value: string) => {
    setTaxPercent(value);
    setTaxEdited(false);
    const nextTax = calculateTaxAmount(gross, discount, parseAmount(value));
    setTaxAmount(nextTax > 0 ? String(nextTax) : '');
  };

  const handleGrossOrDiscountChange = (grossValue: string, discountValue: string) => {
    if (!taxEdited) {
      const nextTax = calculateTaxAmount(
        parseAmount(grossValue),
        parseAmount(discountValue),
        percent,
      );
      setTaxAmount(nextTax > 0 ? String(nextTax) : '');
    }
  };

  const updateLine = (key: string, patch: Partial<ProductLine>) => {
    setProductLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
    setLineErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const removeLine = (key: string) => {
    setProductLines((current) => {
      const next = current.filter((line) => line.key !== key);
      return next.length > 0 ? next : [createLine()];
    });
  };

  const validateProductLines = () => {
    const nextErrors: Record<string, string> = {};
    const validLines = productLines.filter((line) => line.product != null);

    if (validLines.length === 0) {
      setError('Add at least one product to the sale');
      return false;
    }

    for (const line of validLines) {
      const qty = parseAmount(line.quantity);
      if (qty <= 0) {
        nextErrors[line.key] = 'Quantity must be greater than zero';
      }
    }

    setLineErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix product quantities');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!customer) {
      setCustomerError('Please select a customer');
      return;
    }

    if (amountMode === 'products' && !validateProductLines()) {
      return;
    }

    if (amountMode === 'manual' && gross <= 0) {
      setError('Gross amount must be greater than zero');
      return;
    }

    if (netAmount <= 0) {
      setError('Net amount must be greater than zero');
      return;
    }

    setSaving(true);
    setError('');
    setCustomerError('');
    try {
      const payload =
        amountMode === 'products'
          ? {
              customerId: customer.id,
              invoiceNumber: invoiceNumber.trim() || undefined,
              invoiceDetails: invoiceDetails.trim() || undefined,
              items: parsedLines.map((line) => ({
                productId: line.product.id,
                quantity: line.quantity,
              })),
              taxPercent: percent || undefined,
              taxAmount: effectiveTax || undefined,
              notes: notes.trim() || undefined,
            }
          : {
              customerId: customer.id,
              invoiceNumber: invoiceNumber.trim() || undefined,
              invoiceDetails: invoiceDetails.trim() || undefined,
              grossAmount: gross,
              discountAmount: discount || undefined,
              taxPercent: percent || undefined,
              taxAmount: effectiveTax || undefined,
              notes: notes.trim() || undefined,
            };

      await api.createSale(token, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create sale');
    } finally {
      setSaving(false);
    }
  };

  const renderModeChip = (label: string, mode: AmountMode) => {
    const selected = amountMode === mode;
    return (
      <Pressable
        key={mode}
        style={[styles.modeChip, selected && styles.modeChipActive]}
        onPress={() => {
          setAmountMode(mode);
          setError('');
        }}
      >
        <Text style={[styles.modeChipText, selected && styles.modeChipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  if (loadingDefaults) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <RefreshableScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <CustomerAutocomplete
          token={token}
          value={customer}
          onChange={(selected) => {
            setCustomer(selected);
            setCustomerError('');
          }}
          error={customerError}
        />

        <Input
          label="Invoice Number"
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
          autoCapitalize="characters"
        />
        <Text style={styles.fieldHint}>
          Auto-generated from your last invoice. You can change it before saving.
        </Text>
        <Input
          label="Invoice Details"
          value={invoiceDetails}
          onChangeText={setInvoiceDetails}
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <Text style={styles.sectionTitle}>Invoice Amounts</Text>
        <View style={styles.modeRow}>
          {renderModeChip('Manual entry', 'manual')}
          {renderModeChip('Add products', 'products')}
        </View>

        {amountMode === 'products' ? (
          <View style={styles.productsSection}>
            {productLines.map((line, index) => (
              <View key={line.key} style={styles.productLineCard}>
                <View style={styles.productLineHeader}>
                  <Text style={styles.productLineTitle}>Product {index + 1}</Text>
                  {productLines.length > 1 ? (
                    <Pressable onPress={() => removeLine(line.key)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </Pressable>
                  ) : null}
                </View>

                <ProductAutocomplete
                  token={token}
                  value={line.product}
                  onChange={(product) => updateLine(line.key, { product })}
                  error={lineErrors[line.key]}
                />

                <Input
                  label="Quantity *"
                  value={line.quantity}
                  onChangeText={(value) => updateLine(line.key, { quantity: value })}
                  keyboardType="decimal-pad"
                />

                {line.product ? (
                  <Text style={styles.lineAmount}>
                    Line total: {formatCurrency(calculateLineAmount(line.product, parseAmount(line.quantity) || 0))}
                  </Text>
                ) : null}
              </View>
            ))}

            <Pressable style={styles.addLineButton} onPress={() => setProductLines((c) => [...c, createLine()])}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addLineText}>Add another product</Text>
            </Pressable>

            <View style={styles.calculatedRow}>
              <Text style={styles.calculatedLabel}>Gross (from products)</Text>
              <Text style={styles.calculatedValue}>{formatCurrency(productTotals.gross)}</Text>
            </View>
            <View style={styles.calculatedRow}>
              <Text style={styles.calculatedLabel}>Discount (from products)</Text>
              <Text style={styles.calculatedValue}>{formatCurrency(productTotals.discount)}</Text>
            </View>
          </View>
        ) : (
          <>
            <Input
              label="Gross Amount *"
              value={grossAmount}
              onChangeText={(value) => {
                setGrossAmount(value);
                handleGrossOrDiscountChange(value, discountAmount);
              }}
              keyboardType="decimal-pad"
            />
            <Input
              label="Discount"
              value={discountAmount}
              onChangeText={(value) => {
                setDiscountAmount(value);
                handleGrossOrDiscountChange(grossAmount, value);
              }}
              keyboardType="decimal-pad"
            />
          </>
        )}

        <Input
          label="Tax %"
          value={taxPercent}
          onChangeText={handleTaxPercentChange}
          keyboardType="decimal-pad"
        />
        <Input
          label="Tax Amount"
          value={taxAmount}
          onChangeText={(value) => {
            setTaxAmount(value);
            setTaxEdited(true);
          }}
          keyboardType="decimal-pad"
        />

        <View style={styles.netRow}>
          <Text style={styles.netLabel}>Net Amount</Text>
          <Text style={styles.netValue}>{formatCurrency(netAmount)}</Text>
        </View>

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          style={styles.multiline}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Create Sale" onPress={handleSave} loading={saving} />
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  fieldHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 16,
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: colors.primary,
  },
  modeChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  modeChipTextActive: { color: colors.primary },
  productsSection: { marginBottom: 8 },
  productLineCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.surfaceElevated,
  },
  productLineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productLineTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  lineAmount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 4,
  },
  addLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 4,
  },
  addLineText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calculatedLabel: { color: colors.textSecondary, fontSize: 13 },
  calculatedValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  netLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  netValue: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  error: { color: colors.error, marginBottom: 12 },
});
