import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
type DetailTabBarProps = {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
};

export function DetailTabBar({ tabs, activeTab, onChange }: DetailTabBarProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, selected && styles.tabActive]}
            onPress={() => onChange(tab.id)}
          >
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },

  };
}
