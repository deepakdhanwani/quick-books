import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

export type AutocompleteOption = {
  label: string;
  value: string;
  description?: string;
};

type AutocompleteProps = {
  label: string;
  value: string;
  selectedValue?: string;
  options: AutocompleteOption[];
  placeholder?: string;
  onChangeText: (text: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  onClearSelection?: () => void;
};

export function Autocomplete({
  label,
  value,
  selectedValue,
  options,
  placeholder = 'Type to search...',
  onChangeText,
  onSelect,
  onClearSelection,
}: AutocompleteProps) {
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, value]);

  const showSuggestions = focused && filtered.length > 0;
  const hasSelection = Boolean(selectedValue);

  const handleChangeText = (text: string) => {
    if (hasSelection && text !== value) {
      onClearSelection?.();
    }
    onChangeText(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, hasSelection && styles.inputSelected]}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {showSuggestions ? (
        <View style={styles.suggestionsBox}>
          <ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.map((option) => {
              const selected = selectedValue === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.suggestionItem, selected && styles.suggestionItemSelected]}
                  onPress={() => {
                    onSelect(option);
                    setFocused(false);
                  }}
                >
                  <Text style={[styles.suggestionText, selected && styles.suggestionTextSelected]}>
                    {option.label}
                  </Text>
                  {option.description ? (
                    <Text style={styles.suggestionDesc}>{option.description}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {focused && value.trim() && filtered.length === 0 ? (
        <Text style={styles.noResults}>No matching business types</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    width: '100%',
  },
  inputSelected: {
    borderColor: colors.primary,
  },
  suggestionsBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    width: '100%',
  },
  suggestionsList: {
    maxHeight: 220,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionItemSelected: {
    backgroundColor: colors.primary + '22',
  },
  suggestionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  suggestionDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  noResults: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
