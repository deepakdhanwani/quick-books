import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
type InputProps = TextInputProps & {
  label: string;
  enableVisibilityToggle?: boolean;
};

export function Input({
  label,
  enableVisibilityToggle,
  secureTextEntry,
  multiline,
  style,
  ...props
}: InputProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry) && !revealed;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            multiline && styles.multiline,
            enableVisibilityToggle && styles.inputWithToggle,
            style,
          ]}
          secureTextEntry={isSecure}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        {enableVisibilityToggle ? (
          <Pressable
            style={styles.toggle}
            onPress={() => setRevealed((value) => !value)}
            accessibilityLabel={revealed ? 'Hide PIN' : 'Show PIN'}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: {
    marginBottom: 16,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: 6,
    fontSize: theme.scaleFont(14),
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: theme.scaleFont(16),
  },
  multiline: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },

  };
}
