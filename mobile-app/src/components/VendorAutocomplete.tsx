import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, Vendor } from '../services/api';
import { colors } from '../theme/colors';

type VendorAutocompleteProps = {
  token: string;
  value: Vendor | null;
  onChange: (vendor: Vendor | null) => void;
  error?: string;
};

export function VendorAutocomplete({ token, value, onChange, error }: VendorAutocompleteProps) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<Vendor[]>([]);
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
        const response = await api.listVendors(token, 0, 10, true, query.trim());
        setResults(response.content);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query, token]);

  const handleSelect = (vendor: Vendor) => {
    onChange(vendor);
    setQuery(vendor.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setOpen(true);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Vendor *</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search vendor by name or phone"
          placeholderTextColor={colors.textSecondary}
        />
        {value ? (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {open && !value ? (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.dropdownLoading}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : results.length === 0 ? (
            <Text style={styles.emptyText}>No active vendors found</Text>
          ) : (
            results.map((vendor) => (
              <Pressable
                key={vendor.id}
                style={styles.option}
                onPress={() => handleSelect(vendor)}
              >
                <Text style={styles.optionName}>{vendor.name}</Text>
                <Text style={styles.optionMeta}>
                  {vendor.phone ?? vendor.email ?? 'No contact info'}
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

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dropdownLoading: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    padding: 14,
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  optionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
  },
});
