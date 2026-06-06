import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export type CheckboxOption = {
  label: string;
  value: string;
  description?: string;
};

type CheckboxListProps = {
  label: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  emptyText?: string;
};

export function CheckboxList({
  label,
  options,
  selectedValues,
  onChange,
  emptyText = 'No options available',
}: CheckboxListProps) {
  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange([...selectedValues, value]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {options.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View style={styles.list}>
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <Pressable
                key={option.value}
                style={[styles.item, checked && styles.itemChecked]}
                onPress={() => toggleValue(option.value)}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{option.label}</Text>
                  {option.description ? (
                    <Text style={styles.itemDescription}>{option.description}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 8,
    fontSize: 14,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  itemChecked: {
    borderColor: colors.primary + '66',
    backgroundColor: colors.primary + '14',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  itemDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
