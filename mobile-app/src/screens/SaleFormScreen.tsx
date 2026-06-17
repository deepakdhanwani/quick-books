import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CustomerAutocomplete } from '../components/CustomerAutocomplete';
import { Input } from '../components/Input';
import { ProductAutocomplete } from '../components/ProductAutocomplete';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Customer, Product, SaleItem } from '../services/api';
import { calculateLineAmount, calculateLinesTotals } from '../utils/productAmounts';
import {
  calculateNetAmount,
  calculateTaxAmount,
  formatCurrency,
  formatTaxAmountValue,
  optionalAmountField,
  optionalTaxAmountField,
  parseAmount,
} from '../utils/saleAmounts';

type SaleFormScreenProps = {
  token: string;
  saleId?: number;
  onSaved: () => void;
};

type AmountMode = 'manual' | 'products';

type AddedProduct = {
  key: string;
  product: Product;
  quantity: string;
};

function saleItemToProduct(item: SaleItem): Product | null {
  if (item.productId == null) {
    return null;
  }
  const discount = item.discount ?? 0;
  return {
    id: item.productId,
    name: item.productName ?? item.description,
    sellingPrice: item.unitPrice,
    discount,
    netAmount: item.unitPrice - discount,
    active: true,
    createdAt: '',
  };
}

function createAddedProduct(product: Product, quantity = '1'): AddedProduct {
  return {
    key: `${product.id}-${Date.now()}-${Math.random()}`,
    product,
    quantity,
  };
}

export function SaleFormScreen({ token, saleId, onSaved }: SaleFormScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const isEditing = saleId != null;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amountMode, setAmountMode] = useState<AmountMode>('manual');
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxEdited, setTaxEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerError, setCustomerError] = useState('');
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadForm = async () => {
      setLoading(true);
      setError('');
      try {
        if (isEditing && saleId != null) {
          const sale = await api.getSale(token, saleId);
          if (cancelled) return;

          const saleCustomer = await api.getCustomer(token, sale.customerId);
          if (cancelled) return;

          setCustomer(saleCustomer);
          setInvoiceNumber(sale.invoiceNumber ?? '');
          setNotes(sale.notes ?? '');
          setTaxPercent(sale.taxPercent != null ? String(sale.taxPercent) : '');
          setTaxAmount(sale.taxAmount != null ? String(sale.taxAmount) : '');
          setTaxEdited(true);

          if (sale.items && sale.items.length > 0) {
            setAmountMode('products');
            setAddedProducts(
              sale.items
                .map((item) => {
                  const product = saleItemToProduct(item);
                  if (!product) return null;
                  return createAddedProduct(product, String(item.quantity));
                })
                .filter((line): line is AddedProduct => line != null),
            );
          } else {
            setAmountMode('manual');
            setGrossAmount(sale.grossAmount != null ? String(sale.grossAmount) : '');
            setDiscountAmount(
              sale.discountAmount != null && sale.discountAmount > 0
                ? String(sale.discountAmount)
                : '',
            );
          }
        } else {
          const [profile, nextInvoice] = await Promise.all([
            api.getAccountProfile(token),
            api.getNextInvoiceNumber(token),
          ]);
          if (cancelled) return;

          setInvoiceNumber(nextInvoice.invoiceNumber);
          if (profile.defaultTaxPercent != null) {
            setTaxPercent(String(profile.defaultTaxPercent));
          }
        }
      } catch {
        if (!cancelled) {
          setError(isEditing ? 'Could not load sale' : 'Could not load sale defaults');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadForm();
    return () => {
      cancelled = true;
    };
  }, [isEditing, saleId, token]);

  const parsedLines = useMemo(
    () =>
      addedProducts.map((line) => ({
        product: line.product,
        quantity: parseAmount(line.quantity) || 0,
      })),
    [addedProducts],
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
      setTaxAmount(formatTaxAmountValue(nextTax));
    }
  }, [amountMode, productTotals.discount, productTotals.gross, percent, taxEdited]);

  const handleTaxPercentChange = (value: string) => {
    setTaxPercent(value);
    setTaxEdited(false);
    const nextTax = calculateTaxAmount(gross, discount, parseAmount(value));
    setTaxAmount(formatTaxAmountValue(nextTax));
  };

  const handleGrossOrDiscountChange = (grossValue: string, discountValue: string) => {
    if (!taxEdited) {
      const nextTax = calculateTaxAmount(
        parseAmount(grossValue),
        parseAmount(discountValue),
        percent,
      );
      setTaxAmount(formatTaxAmountValue(nextTax));
    }
  };

  const handleAddProduct = (product: Product) => {
    setAddedProducts((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        const nextQty = (parseAmount(existing.quantity) || 0) + 1;
        return current.map((line) =>
          line.key === existing.key ? { ...line, quantity: String(nextQty) } : line,
        );
      }
      return [...current, createAddedProduct(product)];
    });
    setError('');
  };

  const updateProductQuantity = (key: string, quantity: string) => {
    setAddedProducts((current) =>
      current.map((line) => (line.key === key ? { ...line, quantity } : line)),
    );
    setLineErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const removeProduct = (key: string) => {
    setAddedProducts((current) => current.filter((line) => line.key !== key));
  };

  const validateProductLines = () => {
    const nextErrors: Record<string, string> = {};

    if (addedProducts.length === 0) {
      setError('Add at least one product to the sale');
      return false;
    }

    for (const line of addedProducts) {
      const qty = parseAmount(line.quantity);
      if (qty <= 0) {
        nextErrors[line.key] = 'Invalid quantity';
      }
    }

    setLineErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix product quantities');
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const base = {
      customerId: customer!.id,
      invoiceNumber: invoiceNumber.trim() || undefined,
      taxPercent: optionalAmountField(taxPercent, percent),
      taxAmount: optionalTaxAmountField(taxAmount, taxEdited, effectiveTax),
      notes: notes.trim() || undefined,
    };

    if (amountMode === 'products') {
      return {
        ...base,
        items: parsedLines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      };
    }

    return {
      ...base,
      grossAmount: gross,
      discountAmount: discount || undefined,
    };
  };

  const handleSave = async () => {
    if (!customer) {
      setCustomerError('Please select a customer');
      return;
    }

    if (!invoiceNumber.trim()) {
      setError('Invoice number is required');
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
      const payload = buildPayload();
      if (isEditing && saleId != null) {
        await api.updateSale(token, saleId, payload);
      } else {
        await api.createSale(token, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save sale');
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
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
          label="Invoice Number *"
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
          autoCapitalize="characters"
        />
        {!isEditing ? (
          <Text style={styles.fieldHint}>
            Auto-generated from your last invoice. You can change it before saving.
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Invoice Amounts</Text>
        <View style={styles.modeRow}>
          {renderModeChip('Manual entry', 'manual')}
          {renderModeChip('Add products', 'products')}
        </View>

        {amountMode === 'products' ? (
          <View style={styles.productsSection}>
            <ProductAutocomplete
              token={token}
              value={null}
              clearAfterSelect
              label="Search and add product"
              onChange={(product) => {
                if (product) {
                  handleAddProduct(product);
                }
              }}
            />

            {addedProducts.length > 0 ? (
              <View style={styles.addedList}>
                {addedProducts.map((line) => {
                  const qty = parseAmount(line.quantity) || 0;
                  return (
                    <View key={line.key} style={styles.addedRow}>
                      <View style={styles.addedMain}>
                        <Text style={styles.addedName} numberOfLines={1}>
                          {line.product.name}
                        </Text>
                        <View style={styles.qtyRow}>
                          <Text style={styles.qtyLabel}>Qty</Text>
                          <TextInput
                            style={[
                              styles.qtyInput,
                              lineErrors[line.key] ? styles.qtyInputError : null,
                            ]}
                            value={line.quantity}
                            onChangeText={(value) => updateProductQuantity(line.key, value)}
                            keyboardType="decimal-pad"
                          />
                          <Text style={styles.addedAmount}>
                            {formatCurrency(calculateLineAmount(line.product, qty))}
                          </Text>
                        </View>
                        {lineErrors[line.key] ? (
                          <Text style={styles.lineError}>{lineErrors[line.key]}</Text>
                        ) : null}
                      </View>
                      <Pressable onPress={() => removeProduct(line.key)} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyProducts}>Search and select products to add them here.</Text>
            )}

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

        <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={isEditing ? 'Save Sale' : 'Create Sale'}
          onPress={handleSave}
          loading={saving}
        />
      </Card>
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  fieldHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginTop: -8,
    marginBottom: 12,
    lineHeight: theme.scaleFont(16),
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: theme.colors.primary,
  },
  modeChipText: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13), fontWeight: '600' },
  modeChipTextActive: { color: theme.colors.primary },
  productsSection: { marginBottom: 8 },
  addedList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  addedMain: { flex: 1, minWidth: 0 },
  addedName: { color: theme.colors.text, fontSize: theme.scaleFont(14), fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  qtyLabel: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(12) },
  qtyInput: {
    width: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    backgroundColor: theme.colors.surface,
  },
  qtyInputError: { borderColor: theme.colors.error },
  addedAmount: {
    flex: 1,
    textAlign: 'right',
    color: theme.colors.primary,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
  },
  lineError: { color: theme.colors.error, fontSize: theme.scaleFont(11), marginTop: 4 },
  emptyProducts: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    marginBottom: 12,
    fontStyle: 'italic',
  },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  calculatedLabel: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(13) },
  calculatedValue: { color: theme.colors.text, fontSize: theme.scaleFont(14), fontWeight: '600' },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 16,
  },
  netLabel: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600' },
  netValue: { color: theme.colors.primary, fontSize: theme.scaleFont(20), fontWeight: '700' },
  error: { color: theme.colors.error, marginBottom: 12 },

  };
}
