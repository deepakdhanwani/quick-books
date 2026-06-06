import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminRoute, NAV_ITEMS } from '../navigation/routes';
import { colors } from '../theme/colors';

type SidebarProps = {
  activeRoute: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  onLogout: () => void;
};

export function Sidebar({ activeRoute, onNavigate, onLogout }: SidebarProps) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Text style={styles.brandTitle}>Quick Books</Text>
        <Text style={styles.brandSubtitle}>Admin Portal</Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = activeRoute === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => onNavigate(item.id)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    height: '100%',
  },
  brand: {
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  nav: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: colors.surfaceElevated,
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  logout: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  logoutText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
