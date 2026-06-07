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
  onSignOut: () => void | Promise<void>;
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

  const handleSignOut = () => {
    onClose();
    void onSignOut();
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
          <View style={[styles.drawer, { paddingTop: topInset + 12, paddingBottom: 16 }]}>
            <View style={styles.brandBlock}>
              <View style={styles.brandIcon}>
                <Ionicons name="book-outline" size={18} color={colors.primary} />
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
                <Ionicons name="close" size={18} color={colors.textSecondary} />
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

            <Pressable
              style={styles.signOutButton}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Ionicons name="log-out-outline" size={17} color={colors.error} />
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
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: 6,
  },
  signOutText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
