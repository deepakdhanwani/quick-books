import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { DrawerRoute } from '../../navigation/types';
import { useAppTheme } from '../../theme/AppThemeContext';
import type { AppTheme } from '../../theme/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

type WorkspaceTile = {
  route: DrawerRoute;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type WorkspaceTilesProps = {
  tiles: WorkspaceTile[];
  onNavigate: (route: DrawerRoute) => void;
};

export function WorkspaceTiles({ tiles, onNavigate }: WorkspaceTilesProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Your Workspace</Text>
      <Text style={styles.subtitle}>Jump into customers, inventory, and transactions</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.route}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            onPress={() => onNavigate(tile.route)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Ionicons name={tile.icon} size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.value}>{tile.value}</Text>
            <Text style={styles.label}>{tile.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} style={styles.chevron} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginBottom: 8,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(16),
      fontWeight: '700' as const,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(12),
      marginBottom: 12,
    },
    strip: {
      gap: 10,
      paddingRight: 4,
    },
    tile: {
      width: 118,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      position: 'relative' as const,
    },
    pressed: {
      opacity: 0.9,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 10,
    },
    value: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(20),
      fontWeight: '800' as const,
      marginBottom: 2,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600' as const,
    },
    chevron: {
      position: 'absolute' as const,
      top: 12,
      right: 10,
    },
  };
}
