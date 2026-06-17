import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { ReactNode, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DRAWER_NAV_ITEMS, DrawerNavItem, DrawerRoute } from '../navigation/types';
import { MenuNavItem } from './MenuNavItem';
import { CompanyBusinessTypeOption, CompanyOption, SubscriberAccountProfile } from '../services/api';

const DRAWER_WIDTH = 288;

type DrawerLayoutProps = {
  open: boolean;
  activeRoute: DrawerRoute;
  profile: SubscriberAccountProfile | null;
  companies: CompanyOption[];
  businessTypes: CompanyBusinessTypeOption[];
  activeCompanyId?: number;
  switchingCompany?: boolean;
  navItems?: DrawerNavItem[];
  canManageCompanies?: boolean;
  onClose: () => void;
  onNavigate: (route: DrawerRoute) => void;
  onSwitchCompany: (companyId: number) => void | Promise<void>;
  onCreateCompany: (name: string, businessTypeId: number) => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
};

export function DrawerLayout({
  open,
  activeRoute,
  profile,
  companies,
  businessTypes,
  activeCompanyId,
  switchingCompany = false,
  navItems = DRAWER_NAV_ITEMS,
  canManageCompanies = true,
  onClose,
  onNavigate,
  onSwitchCompany,
  onCreateCompany,
  onSignOut,
  children,
}: DrawerLayoutProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newBusinessTypeId, setNewBusinessTypeId] = useState<number | undefined>(undefined);
  const [businessTypeQuery, setBusinessTypeQuery] = useState('');

  const activeCompanyName = useMemo(() => {
    const matched = companies.find((company) => company.id === activeCompanyId);
    return matched?.name ?? profile?.businessName ?? 'Main Company';
  }, [activeCompanyId, companies, profile?.businessName]);
  const filteredBusinessTypes = useMemo(() => {
    const query = businessTypeQuery.trim().toLowerCase();
    if (!query) {
      return businessTypes.slice(0, 6);
    }
    return businessTypes
      .filter((businessType) => businessType.name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [businessTypeQuery, businessTypes]);

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
                <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandTitle}>Quick Books</Text>
                <Text style={styles.brandSubtitle} numberOfLines={1}>
                  {activeCompanyName}
                </Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close menu"
                accessibilityRole="button"
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.companySwitcher}>
              <Pressable
                style={styles.companyTrigger}
                onPress={() => setExpanded((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel="Switch company"
              >
                <View style={styles.companyTriggerText}>
                  <Text style={styles.companyLabel}>Company</Text>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {activeCompanyName}
                  </Text>
                </View>
                {switchingCompany ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                )}
              </Pressable>

              {expanded ? (
                <View style={styles.companyMenu}>
                  {companies.map((company) => {
                    const selected = company.id === activeCompanyId;
                    return (
                      <Pressable
                        key={company.id}
                        style={[styles.companyOption, selected && styles.companyOptionSelected]}
                        disabled={switchingCompany}
                        onPress={() => {
                          setExpanded(false);
                          void onSwitchCompany(company.id);
                        }}
                      >
                        <Text style={[styles.companyOptionText, selected && styles.companyOptionTextSelected]}>
                          {company.name}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}

                  {canManageCompanies ? (
                  <Pressable
                    style={styles.addCompanyButton}
                    onPress={() =>
                      setCreating((value) => {
                        const next = !value;
                        if (next) {
                          setNewBusinessTypeId(undefined);
                          setBusinessTypeQuery('');
                        } else {
                          setNewBusinessTypeId(undefined);
                          setBusinessTypeQuery('');
                        }
                        return next;
                      })
                    }
                  >
                    <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.addCompanyText}>Add company</Text>
                  </Pressable>
                  ) : null}

                  {creating && canManageCompanies ? (
                    <View style={styles.createCompanyBox}>
                      <TextInput
                        style={styles.createCompanyInput}
                        value={newCompanyName}
                        onChangeText={setNewCompanyName}
                        placeholder="Company name"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                      <Text style={styles.businessTypeLabel}>Business type</Text>
                      <TextInput
                        style={styles.createCompanyInput}
                        value={businessTypeQuery}
                        onChangeText={(text) => {
                          setBusinessTypeQuery(text);
                          setNewBusinessTypeId(undefined);
                        }}
                        placeholder="Search business type"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                      <View style={styles.businessTypeSuggestor}>
                        {filteredBusinessTypes.length === 0 ? (
                          <Text style={styles.businessTypeEmpty}>No matching business type</Text>
                        ) : (
                          filteredBusinessTypes.map((businessType) => {
                            const selected = newBusinessTypeId === businessType.id;
                            return (
                              <Pressable
                                key={businessType.id}
                                style={[
                                  styles.businessTypeOption,
                                  selected && styles.businessTypeOptionSelected,
                                ]}
                                onPress={() => {
                                  setNewBusinessTypeId(businessType.id);
                                  setBusinessTypeQuery(businessType.name);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.businessTypeOptionText,
                                    selected && styles.businessTypeOptionTextSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {businessType.name}
                                </Text>
                              </Pressable>
                            );
                          })
                        )}
                      </View>
                      <Pressable
                        style={styles.createCompanySave}
                        onPress={() => {
                          const name = newCompanyName.trim();
                          if (!name || newBusinessTypeId == null) {
                            return;
                          }
                          setNewCompanyName('');
                          setNewBusinessTypeId(undefined);
                          setBusinessTypeQuery('');
                          setCreating(false);
                          setExpanded(false);
                          void onCreateCompany(name, newBusinessTypeId);
                        }}
                      >
                        <Text style={styles.createCompanySaveText}>Create</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                  {navItems.map((item) => (
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
              <Ionicons name="log-out-outline" size={17} color={theme.colors.error} />
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

function createStyles(theme: AppTheme) {
  return {
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
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
  companySwitcher: {
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  companyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  companyTriggerText: {
    flex: 1,
  },
  companyLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(11),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  companyName: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(13),
    fontWeight: '700',
  },
  companyMenu: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 8,
    gap: 6,
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  companyOptionSelected: {
    backgroundColor: `${theme.colors.primary}1f`,
  },
  companyOptionText: {
    color: theme.colors.text,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
    flex: 1,
  },
  companyOptionTextSelected: {
    color: theme.colors.primary,
  },
  addCompanyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginTop: 2,
  },
  addCompanyText: {
    color: theme.colors.primary,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
  },
  createCompanyBox: {
    marginTop: 6,
    gap: 8,
  },
  createCompanyInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: theme.scaleFont(13),
  },
  businessTypeLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(11),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  businessTypeSuggestor: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  businessTypeOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  businessTypeOptionSelected: {
    backgroundColor: `${theme.colors.primary}1f`,
  },
  businessTypeOptionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    fontWeight: '600',
  },
  businessTypeOptionTextSelected: {
    color: theme.colors.primary,
  },
  businessTypeEmpty: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  createCompanySave: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  createCompanySaveText: {
    color: theme.colors.onPrimary,
    fontSize: theme.scaleFont(12),
    fontWeight: '700',
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
    color: theme.colors.text,
    fontSize: theme.scaleFont(16),
    fontWeight: '700',
  },
  brandSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.scaleFont(12),
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
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
    color: theme.colors.error,
    fontSize: theme.scaleFont(13),
    fontWeight: '600',
  },

  };
}
