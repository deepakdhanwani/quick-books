import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { SubscriberAccountProfile } from '../services/api';
type SettingsScreenProps = {
  profile: SubscriberAccountProfile | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onOpenAccount: () => void;
  onOpenPreferences: () => void;
  onOpenDebugLog: () => void;
  onManageTeam: () => void;
  onActivityLog: () => void;
  isOwner: boolean;
};

export function SettingsScreen({
  profile,
  loading,
  refreshing,
  onRefresh,
  onOpenAccount,
  onOpenPreferences,
  onOpenDebugLog,
  onManageTeam,
  onActivityLog,
  isOwner,
}: SettingsScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const displayName = profile?.loggedInUserName ?? profile?.ownerName ?? 'Account';
  const roleLabel = profile?.userType === 'STAFF' ? 'Team user' : 'Owner';

  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading && !profile ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <>
          <Card style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.ownerName}>{displayName}</Text>
              <Text style={styles.businessName}>{profile?.businessName ?? 'Loading...'}</Text>
              <Text style={styles.phone}>{profile?.phone ?? ''}</Text>
              <Text style={styles.role}>{roleLabel}</Text>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Preferences</Text>

          <Pressable style={styles.menuRow} onPress={onOpenPreferences}>
            <View style={styles.menuIcon}>
              <Ionicons name="color-palette-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Appearance</Text>
              <Text style={styles.menuHint}>Theme and font size</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={onOpenAccount}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-circle-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>My Account</Text>
              <Text style={styles.menuHint}>Profile, PIN, and subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>

          {isOwner ? (
            <>
              <Pressable style={styles.menuRow} onPress={onManageTeam}>
                <View style={styles.menuIcon}>
                  <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>Team Users</Text>
                  <Text style={styles.menuHint}>Create staff users and assign PINs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </Pressable>

              <Pressable style={styles.menuRow} onPress={onActivityLog}>
                <View style={styles.menuIcon}>
                  <Ionicons name="list-outline" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>Activity Log</Text>
                  <Text style={styles.menuHint}>Who created, edited, or deleted records</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Developer</Text>

          <Pressable style={styles.menuRow} onPress={onOpenDebugLog}>
            <View style={styles.menuIcon}>
              <Ionicons name="bug-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Debug Log</Text>
              <Text style={styles.menuHint}>On-device API and company-switch trace</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        </>
      )}
    </RefreshableScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: theme.scaleFont(22),
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  ownerName: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(18),
    fontWeight: '700',
  },
  businessName: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(14),
    marginTop: 2,
  },
  phone: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(13),
    marginTop: 2,
  },
  role: {
    color: theme.colors.primary,
    fontSize: theme.scaleFont(12),
    fontWeight: '600',
    marginTop: 6,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(15),
    fontWeight: '600',
  },
  menuHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginTop: 2,
  },

  };
}
