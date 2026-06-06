import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral' | 'primary';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.success + '22', text: colors.success },
  error: { bg: colors.error + '22', text: colors.error },
  warning: { bg: colors.warning + '22', text: colors.warning },
  neutral: { bg: colors.surfaceElevated, text: colors.textSecondary },
  primary: { bg: colors.primary + '22', text: colors.primary },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const palette = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
