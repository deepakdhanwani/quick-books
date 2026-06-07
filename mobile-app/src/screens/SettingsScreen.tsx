import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { SubscriberAccountProfile } from '../services/api';
import { colors } from '../theme/colors';

type SettingsScreenProps = {
  profile: SubscriberAccountProfile | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onOpenAccount: () => void;
};

export function SettingsScreen({
  profile,
  loading,
  refreshing,
  onRefresh,
  onOpenAccount,
}: SettingsScreenProps) {
  return (
    <RefreshableScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading && !profile ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <>
          <Card style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.ownerName ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.ownerName}>{profile?.ownerName ?? 'Account'}</Text>
              <Text style={styles.businessName}>{profile?.businessName ?? 'Loading...'}</Text>
              <Text style={styles.phone}>{profile?.phone ?? ''}</Text>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Preferences</Text>

          <Pressable style={styles.menuRow} onPress={onOpenAccount}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>My Account</Text>
              <Text style={styles.menuHint}>Profile, PIN, and subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </>
      )}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  ownerName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  businessName: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  phone: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  menuHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
