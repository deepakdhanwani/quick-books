import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type TextButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'muted';
};

export function TextButton({ title, onPress, variant = 'primary' }: TextButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={[styles.text, variant === 'danger' && styles.danger, variant === 'muted' && styles.muted]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  danger: {
    color: colors.error,
  },
  muted: {
    color: colors.textSecondary,
  },
});
