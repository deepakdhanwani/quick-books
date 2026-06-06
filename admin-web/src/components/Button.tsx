import { Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, onPress, loading, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      style={[styles.button, variant === 'secondary' && styles.secondary]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
