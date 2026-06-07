import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Customer } from '../services/api';
type CustomerAutocompleteProps = {
  token: string;
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  error?: string;
};

export function CustomerAutocomplete({ token, value, onChange, error }: CustomerAutocompleteProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setQuery(value.name);
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.listCustomers(token, 0, 10, true, query.trim());
        setResults(response.content);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query, token]);

  const handleSelect = (customer: Customer) => {
    onChange(customer);
    setQuery(customer.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setOpen(true);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Customer *</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search customer by name or phone"
          placeholderTextColor={theme.colors.textSecondary}
        />
        {value ? (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {open && !value ? (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.dropdownLoading}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
            </View>
          ) : results.length === 0 ? (
            <Text style={styles.emptyText}>No active customers found</Text>
          ) : (
            results.map((customer) => (
              <Pressable
                key={customer.id}
                style={styles.option}
                onPress={() => handleSelect(customer)}
              >
                <Text style={styles.optionName}>{customer.name}</Text>
                <Text style={styles.optionMeta}>
                  {customer.phone ?? customer.email ?? 'No contact info'}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(14),
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputRowError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.scaleFont(16),
    paddingVertical: 12,
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  dropdownLoading: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    padding: 14,
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionName: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '600',
  },
  optionMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginTop: 2,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.scaleFont(12),
    marginTop: 6,
  },

  };
}
