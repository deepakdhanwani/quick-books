import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export type IconName = 'edit' | 'delete' | 'check' | 'close';

type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'success' | 'muted';
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  disabled = false,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const iconColor =
    variant === 'danger'
      ? colors.error
      : variant === 'success'
        ? colors.success
        : variant === 'muted'
          ? colors.textSecondary
          : colors.primary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'danger' && styles.danger,
        variant === 'success' && styles.success,
        variant === 'muted' && styles.muted,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <IconGlyph icon={icon} color={iconColor} />
    </Pressable>
  );
}

function IconGlyph({ icon, color }: { icon: IconName; color: string }) {
  if (icon === 'delete') {
    return (
      <View style={styles.deleteIcon}>
        <View style={[styles.deleteLid, { backgroundColor: color }]} />
        <View style={[styles.deleteBin, { borderColor: color }]}>
          <View style={[styles.deleteLine, { backgroundColor: color }]} />
          <View style={[styles.deleteLine, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  const glyph =
    icon === 'edit' ? '✎' : icon === 'check' ? '✓' : '✕';

  return (
    <Text style={[styles.glyph, { color }, icon === 'edit' && styles.editGlyph]}>
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  glyph: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  editGlyph: {
    fontSize: 17,
    marginTop: -1,
  },
  deleteIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  deleteLid: {
    width: 12,
    height: 2,
    borderRadius: 1,
    marginBottom: 1,
  },
  deleteBin: {
    width: 10,
    height: 9,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  deleteLine: {
    width: 1,
    height: 5,
    borderRadius: 1,
  },
  danger: {
    backgroundColor: colors.error + '18',
    borderColor: colors.error + '44',
  },
  success: {
    backgroundColor: colors.success + '18',
    borderColor: colors.success + '44',
  },
  muted: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
