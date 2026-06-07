import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { DrawerNavItem } from '../navigation/types';

type MenuNavItemProps = {
  item: DrawerNavItem;
  active: boolean;
  onPress: () => void;
};

export function MenuNavItem({ item, active, onPress }: MenuNavItemProps) {
  return (
    <Pressable
      style={[styles.item, active && styles.itemActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Ionicons name={item.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
