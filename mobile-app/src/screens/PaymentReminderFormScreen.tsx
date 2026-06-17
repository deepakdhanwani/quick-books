import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CustomerAutocomplete } from '../components/CustomerAutocomplete';
import { Input } from '../components/Input';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { api, Customer } from '../services/api';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { toIsoDate } from '../utils/dateListFilter';
import { parseAmount } from '../utils/saleAmounts';

type PaymentReminderFormScreenProps = {
  token: string;
  reminderId?: number;
  initialCustomerId?: number;
  onSaved: () => void;
};

export function PaymentReminderFormScreen({
  token,
  reminderId,
  initialCustomerId,
  onSaved,
}: PaymentReminderFormScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const isEditing = reminderId != null;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [promisedDate, setPromisedDate] = useState(toIsoDate(new Date()));
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(isEditing || initialCustomerId != null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [customerError, setCustomerError] = useState('');

  const getDefaultAmountForCustomer = useCallback((value: Customer | null) => {
    if (!value) {
      return '';
    }
    const pending = value.totalPendingAmount ?? 0;
    if (pending <= 0) {
      return '';
    }
    return String(pending);
  }, []);

  const loadReminder = useCallback(async () => {
    if (!isEditing || reminderId == null) {
      return;
    }

    setError('');
    try {
      const reminder = await api.getPaymentReminder(token, reminderId);
      const loadedCustomer = await api.getCustomer(token, reminder.customerId);
      setCustomer(loadedCustomer);
      setAmount(reminder.amount != null ? String(reminder.amount) : '');
      setPromisedDate(reminder.promisedDate);
      setNotes(reminder.notes ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reminder');
    } finally {
      setLoading(false);
    }
  }, [isEditing, reminderId, token]);

  const loadInitialCustomer = useCallback(async () => {
    if (isEditing || initialCustomerId == null) {
      return;
    }

    setError('');
    try {
      const loadedCustomer = await api.getCustomer(token, initialCustomerId);
      setCustomer(loadedCustomer);
      setAmount(getDefaultAmountForCustomer(loadedCustomer));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customer');
    } finally {
      setLoading(false);
    }
  }, [getDefaultAmountForCustomer, initialCustomerId, isEditing, token]);

  useEffect(() => {
    if (isEditing) {
      void loadReminder();
      return;
    }
    if (initialCustomerId != null) {
      void loadInitialCustomer();
      return;
    }
    setLoading(false);
  }, [initialCustomerId, isEditing, loadInitialCustomer, loadReminder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isEditing) {
      await loadReminder();
    } else if (initialCustomerId != null) {
      await loadInitialCustomer();
    }
    setRefreshing(false);
  };

  const handleCustomerChange = (nextCustomer: Customer | null) => {
    setCustomer(nextCustomer);
    if (!isEditing) {
      setAmount(getDefaultAmountForCustomer(nextCustomer));
    }
    setCustomerError('');
  };

  const handleSave = async () => {
    if (!customer) {
      setCustomerError('Select a customer');
      return;
    }

    const parsedAmount = amount.trim() ? parseAmount(amount) : undefined;
    if (amount.trim() && (parsedAmount == null || parsedAmount < 0)) {
      setError('Enter a valid amount');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(promisedDate.trim())) {
      setError('Enter promised date as YYYY-MM-DD');
      return;
    }

    setSaving(true);
    setError('');
    setCustomerError('');

    const payload = {
      customerId: customer.id,
      amount: parsedAmount,
      promisedDate: promisedDate.trim(),
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditing && reminderId != null) {
        await api.updatePaymentReminder(token, reminderId, payload);
      } else {
        await api.createPaymentReminder(token, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save reminder');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <Card>
        <Text style={styles.sectionTitle}>Customer & payment</Text>
        <CustomerAutocomplete
          token={token}
          value={customer}
          onChange={handleCustomerChange}
          error={customerError}
        />

        <Input
          label="Expected amount (optional)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <Input
          label="Promised payment date *"
          value={promisedDate}
          onChangeText={setPromisedDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Customer promised to pay after salary..."
          multiline
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={isEditing ? 'Save changes' : 'Create reminder'}
        onPress={handleSave}
        loading={saving}
      />
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
      paddingBottom: 36,
      gap: 16,
    },
    loadingBox: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '700' as const,
      marginBottom: 12,
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.scaleFont(13),
      textAlign: 'center' as const,
    },
  };
}
