import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api } from '../services/api';
import { colors } from '../theme/colors';
import { calculateProductNet } from '../utils/productAmounts';
import { formatCurrency, parseAmount } from '../utils/saleAmounts';

type ProductFormScreenProps = {
  token: string;
  productId?: number;
  onSaved: () => void;
};

export function ProductFormScreen({ token, productId, onSaved }: ProductFormScreenProps) {
  const isEditing = productId != null;

  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selling = parseAmount(sellingPrice);
  const disc = parseAmount(discount);
  const netAmount = useMemo(() => calculateProductNet(selling, disc), [selling, disc]);

  const loadProduct = useCallback(async () => {
    if (!isEditing || productId == null) return;

    setLoading(true);
    setError('');
    try {
      const product = await api.getProduct(token, productId);
      setName(product.name);
      setSellingPrice(String(product.sellingPrice));
      setDiscount(product.discount > 0 ? String(product.discount) : '');
      setActive(product.active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load product');
    } finally {
      setLoading(false);
    }
  }, [isEditing, productId, token]);

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [isEditing, loadProduct]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (selling <= 0) {
      setError('Selling price must be greater than zero');
      return;
    }
    if (disc < 0) {
      setError('Discount cannot be negative');
      return;
    }
    if (disc > selling) {
      setError('Discount cannot exceed selling price');
      return;
    }
    if (netAmount <= 0) {
      setError('Net amount must be greater than zero');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        sellingPrice: selling,
        discount: disc || undefined,
        active,
      };

      if (isEditing && productId != null) {
        await api.updateProduct(token, productId, payload);
      } else {
        await api.createProduct(token, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <RefreshableScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Input label="Product Name *" value={name} onChangeText={setName} />
        <Input
          label="Selling Price *"
          value={sellingPrice}
          onChangeText={setSellingPrice}
          keyboardType="decimal-pad"
        />
        <Input
          label="Discount"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="decimal-pad"
        />

        <View style={styles.netRow}>
          <Text style={styles.netLabel}>Net Amount</Text>
          <Text style={styles.netValue}>{formatCurrency(netAmount)}</Text>
        </View>

        <View style={styles.activeRow}>
          <View>
            <Text style={styles.activeLabel}>Active</Text>
            <Text style={styles.activeHint}>Inactive products are hidden from sales</Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={isEditing ? 'Save Product' : 'Create Product'} onPress={handleSave} loading={saving} />
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activeLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  activeHint: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  error: { color: colors.error, marginBottom: 12 },
});
