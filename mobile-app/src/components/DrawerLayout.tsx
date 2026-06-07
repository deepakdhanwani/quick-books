import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { DRAWER_NAV_ITEMS, DrawerRoute } from '../navigation/types';
import { MenuNavItem } from './MenuNavItem';
import { SubscriberAccountProfile } from '../services/api';

const DRAWER_WIDTH = 288;

type DrawerLayoutProps = {
  open: boolean;
  activeRoute: DrawerRoute;
  profile: SubscriberAccountProfile | null;
  onClose: () => void;
  onNavigate: (route: DrawerRoute) => void;
  onSignOut: () => void;
  children: ReactNode;
};

export function DrawerLayout({
  open,
  activeRoute,
  profile,
  onClose,
  onNavigate,
  onSignOut,
  children,
}: DrawerLayoutProps) {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  const handleNavigate = (route: DrawerRoute) => {
    onNavigate(route);
    onClose();
  };

  return (
    <View style={styles.root}>
      {children}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <View style={[styles.drawer, { paddingTop: topInset + 16, paddingBottom: 24 }]}>
            <View style={styles.brandBlock}>
              <View style={styles.brandIcon}>
                <Ionicons name="book-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandTitle}>Quick Books</Text>
                <Text style={styles.brandSubtitle} numberOfLines={1}>
                  {profile?.businessName ?? 'Your business'}
                </Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close menu"
                accessibilityRole="button"
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              {DRAWER_NAV_ITEMS.map((item) => (
                <MenuNavItem
                  key={item.id}
                  item={item}
                  active={activeRoute === item.id}
                  onPress={() => handleNavigate(item.id)}
                />
              ))}
            </ScrollView>

            <Pressable style={styles.signOutButton} onPress={onSignOut} accessibilityRole="button">
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityLabel="Close menu"
            accessibilityRole="button"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  menuScroll: {
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: 8,
  },
  signOutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
