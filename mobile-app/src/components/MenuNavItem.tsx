import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerNavItem } from '../navigation/types';

type MenuNavItemProps = {
  item: DrawerNavItem;
  active: boolean;
  onPress: () => void;
};

export function MenuNavItem({ item, active, onPress }: MenuNavItemProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={[styles.item, active && styles.itemActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Ionicons name={item.icon} size={17} color={active ? theme.colors.primary : theme.colors.textSecondary} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return {
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    marginRight: 10,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    fontWeight: '500',
  },
  labelActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },

  };
}
