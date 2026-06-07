import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Product } from '../services/api';
import { appAlert } from '../utils/appAlert';
import { formatCurrency } from '../utils/saleAmounts';

type ProductDetailScreenProps = {
  token: string;
  productId: number;
  onEdit: () => void;
  onDeleted: () => void;
};

export function ProductDetailScreen({
  token,
  productId,
  onEdit,
  onDeleted,
}: ProductDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [error, setError] = useState('');

  const loadProduct = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) setLoading(true);
      setError('');
      try {
        const data = await api.getProduct(token, productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load product');
      } finally {
        setLoading(false);
      }
    },
    [productId, token],
  );

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProduct(true);
    setRefreshing(false);
  };

  const handleToggleActive = async (value: boolean) => {
    if (!product) return;
    setTogglingActive(true);
    try {
      const updated = await api.setProductActive(token, product.id, value);
      setProduct(updated);
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleDelete = () => {
    if (!product) return;

    appAlert('Delete product', `Delete ${product.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProduct(token, product.id);
            onDeleted();
          } catch (err) {
            appAlert('Delete failed', err instanceof Error ? err.message : 'Could not delete product');
          }
        },
      },
    ]);
  };

  if (loading && !product) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error || 'Product not found'}</Text>
      </View>
    );
  }

  const accentColor = product.active ? theme.colors.success : theme.colors.textSecondary;

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: `${accentColor}20` }]}>
            <Text style={[styles.avatarText, { color: accentColor }]}>
              {product.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.subtitle}>Net {formatCurrency(product.netAmount)}</Text>
          </View>
        </View>

        <DetailRow icon="pricetag-outline" label="Selling Price" value={formatCurrency(product.sellingPrice)} />
        <DetailRow
          icon="trending-down-outline"
          label="Discount"
          value={product.discount > 0 ? formatCurrency(product.discount) : '—'}
        />
        <DetailRow icon="calculator-outline" label="Net Amount" value={formatCurrency(product.netAmount)} />
        <DetailRow
          icon="ellipse-outline"
          label="Status"
          value={product.active ? 'Active' : 'Inactive'}
          valueColor={accentColor}
        />

        <View style={styles.activeRow}>
          <Text style={styles.activeLabel}>Active</Text>
          <Switch
            value={product.active}
            onValueChange={handleToggleActive}
            disabled={togglingActive}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.text}
          />
        </View>
      </Card>

      <Button title="Edit Product" onPress={onEdit} />
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        <Text style={styles.deleteText}>Delete Product</Text>
      </Pressable>
    </RefreshableScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedValueColor = valueColor ?? theme.colors.text;

  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color: resolvedValueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: theme.scaleFont(22), fontWeight: '700' },
  headerText: { flex: 1 },
  name: { color: theme.colors.text, fontSize: theme.scaleFont(20), fontWeight: '700' },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.scaleFont(14), marginTop: 4 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailContent: { flex: 1 },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  detailValue: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '500' },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  activeLabel: { color: theme.colors.text, fontSize: theme.scaleFont(15), fontWeight: '600' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  deleteText: { color: theme.colors.error, fontSize: theme.scaleFont(15), fontWeight: '600' },
  error: { color: theme.colors.error, marginBottom: 12 },

  };
}
