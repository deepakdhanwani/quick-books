import { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AdminRoute, NAV_ITEMS } from '../navigation/routes';
import { colors } from '../theme/colors';
import { Sidebar } from './Sidebar';

type AdminLayoutProps = {
  activeRoute: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AdminLayout({ activeRoute, onNavigate, onLogout, children }: AdminLayoutProps) {
  const title = NAV_ITEMS.find((item) => item.id === activeRoute)?.label ?? 'Admin';

  return (
    <View style={styles.root}>
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} onLogout={onLogout} />
      <View style={styles.main}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  main: {
    flex: 1,
    width: '100%',
  },
  header: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 32,
    width: '100%',
  },
});
