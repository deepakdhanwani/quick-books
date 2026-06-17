import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { StyleSheet, View } from 'react-native';
import { appAlert } from '../utils/appAlert';
import { AppHeader } from '../components/AppHeader';
import { DrawerLayout } from '../components/DrawerLayout';
import { AccountScreen } from '../screens/AccountScreen';
import { ChangePinScreen } from '../screens/ChangePinScreen';
import { CustomerDetailScreen } from '../screens/CustomerDetailScreen';
import { CustomerFormScreen } from '../screens/CustomerFormScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { MakePaymentScreen } from '../screens/MakePaymentScreen';
import { PurchaseDetailScreen } from '../screens/PurchaseDetailScreen';
import { PurchaseFormScreen } from '../screens/PurchaseFormScreen';
import { PurchasesScreen } from '../screens/PurchasesScreen';
import { ReceivePaymentScreen } from '../screens/ReceivePaymentScreen';
import { SaleDetailScreen } from '../screens/SaleDetailScreen';
import { SaleFormScreen } from '../screens/SaleFormScreen';
import { SalesScreen } from '../screens/SalesScreen';
import { VendorDetailScreen } from '../screens/VendorDetailScreen';
import { VendorFormScreen } from '../screens/VendorFormScreen';
import { VendorsScreen } from '../screens/VendorsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ProductFormScreen } from '../screens/ProductFormScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { TeamUsersScreen } from '../screens/TeamUsersScreen';
import { TeamUserFormScreen } from '../screens/TeamUserFormScreen';
import { TeamUserDetailScreen } from '../screens/TeamUserDetailScreen';
import { ActivityLogScreen } from '../screens/ActivityLogScreen';
import { PreferencesScreen } from '../screens/PreferencesScreen';
import { PaymentRemindersScreen } from '../screens/PaymentRemindersScreen';
import { PaymentReminderFormScreen } from '../screens/PaymentReminderFormScreen';
import { DebugLogScreen } from '../screens/DebugLogScreen';
import { api, CompanyBusinessTypeOption, CompanyOption, setActiveCompanyId, SubscriberAccountProfile, SubscriberAuthResponse } from '../services/api';
import { debugLog } from '../services/debugLog';
import { saveCachedPreferences } from '../services/preferenceStorage';
import { useUserPreferences } from '../theme/AppThemeContext';
import { toUserPreferences } from '../utils/userPreferences';
import { DrawerRoute, StackRoute, DRAWER_NAV_ITEMS } from './types';
import {
  canAccessDrawerRoute,
  canManageCompanies as canManageCompaniesPermission,
  canModule,
  isSubscriberOwner,
  resolveStaffPermissions,
} from '../utils/staffPermissions';

type AppShellProps = {
  auth: SubscriberAuthResponse;
  onLogout: () => void | Promise<void>;
  onSubscriptionChanged: (auth: SubscriberAuthResponse) => void | Promise<void>;
};

export function AppShell({ auth, onLogout, onSubscriptionChanged }: AppShellProps) {
  const styles = useThemedStyles(createStyles);
  const { setPreferences } = useUserPreferences();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRoute, setDrawerRoute] = useState<DrawerRoute>('dashboard');
  const [stackRoute, setStackRoute] = useState<StackRoute | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [editingCustomerId, setEditingCustomerId] = useState<number | undefined>(undefined);
  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(undefined);
  const [editingVendorId, setEditingVendorId] = useState<number | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [editingProductId, setEditingProductId] = useState<number | undefined>(undefined);
  const [selectedSaleId, setSelectedSaleId] = useState<number | undefined>(undefined);
  const [editingSaleId, setEditingSaleId] = useState<number | undefined>(undefined);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | undefined>(undefined);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | undefined>(undefined);
  const [selectedTeamUserId, setSelectedTeamUserId] = useState<number | undefined>(undefined);
  const [editingReminderId, setEditingReminderId] = useState<number | undefined>(undefined);
  const [initialReminderCustomerId, setInitialReminderCustomerId] = useState<number | undefined>(undefined);

  const [profile, setProfile] = useState<SubscriberAccountProfile | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>(auth.companies ?? []);
  const [companyBusinessTypes, setCompanyBusinessTypes] = useState<CompanyBusinessTypeOption[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<number | undefined>(auth.activeCompanyId);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isActiveRef = useRef(true);
  const switchSeqRef = useRef(0);
  const pendingCompanyIdRef = useRef<number | null>(null);
  const switchInFlightRef = useRef(false);

  const hasActiveSubscription = profile?.subscriptionStatus === 'ACTIVE';
  const requiresSubscription = profile != null && !hasActiveSubscription;
  const isOwner = isSubscriberOwner(
    profile?.userType ?? auth.userType,
    profile?.owner,
  );
  const staffPermissions = resolveStaffPermissions(
    isOwner,
    profile?.staffPermissions ?? auth.staffPermissions,
  );
  const drawerNavItems = DRAWER_NAV_ITEMS.filter((item) =>
    canAccessDrawerRoute(item.id, staffPermissions, isOwner),
  );
  const allowManageCompanies = canManageCompaniesPermission(staffPermissions, isOwner);
  const canCustomerCreate = canModule(staffPermissions, isOwner, 'customers', 'create');
  const canCustomerEdit = canModule(staffPermissions, isOwner, 'customers', 'edit');
  const canCustomerDelete = canModule(staffPermissions, isOwner, 'customers', 'delete');
  const canVendorCreate = canModule(staffPermissions, isOwner, 'vendors', 'create');
  const canVendorEdit = canModule(staffPermissions, isOwner, 'vendors', 'edit');
  const canVendorDelete = canModule(staffPermissions, isOwner, 'vendors', 'delete');
  const canProductCreate = canModule(staffPermissions, isOwner, 'products', 'create');
  const canProductEdit = canModule(staffPermissions, isOwner, 'products', 'edit');
  const canProductDelete = canModule(staffPermissions, isOwner, 'products', 'delete');
  const canSaleCreate = canModule(staffPermissions, isOwner, 'sales', 'create');
  const canSaleEdit = canModule(staffPermissions, isOwner, 'sales', 'edit');
  const canPurchaseCreate = canModule(staffPermissions, isOwner, 'purchases', 'create');
  const canPurchaseEdit = canModule(staffPermissions, isOwner, 'purchases', 'edit');
  const canReminderCreate = canModule(staffPermissions, isOwner, 'reminders', 'create');
  const canReminderEdit = canModule(staffPermissions, isOwner, 'reminders', 'edit');
  const canReminderDelete = canModule(staffPermissions, isOwner, 'reminders', 'delete');
  const canViewReports = isOwner || staffPermissions.viewReports;
  const dashboardQuickActions = [
    ...(canSaleCreate ? ['sale'] : []),
    ...(canPurchaseCreate ? ['purchase'] : []),
    ...(canCustomerCreate ? ['customer'] : []),
    ...(canViewReports ? ['reports'] : []),
  ];
  const dashboardWorkspaceRoutes = drawerNavItems
    .map((item) => item.id)
    .filter((route) => route !== 'dashboard' && route !== 'reports' && route !== 'settings' && route !== 'reminders');

  const loadProfile = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) {
        setProfileLoading(true);
      }
      setProfileError('');
      try {
        const data = await api.getAccountProfile(auth.token);
        if (!isActiveRef.current) {
          return;
        }
        setProfile(data);
        if (data.companies?.length) {
          setCompanies(data.companies);
        }
        const nextPreferences = toUserPreferences(data);
        setPreferences(nextPreferences);
        await saveCachedPreferences(nextPreferences);
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Could not load account details');
      } finally {
        if (!isPullRefresh) {
          setProfileLoading(false);
        }
      }
    },
    [auth.token, setPreferences],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile(true);
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => {
    if (!drawerNavItems.some((item) => item.id === drawerRoute)) {
      setDrawerRoute(drawerNavItems[0]?.id ?? 'settings');
    }
  }, [drawerNavItems, drawerRoute]);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    setActiveCompanyId(auth.activeCompanyId);
    setActiveCompanyIdState(auth.activeCompanyId);
  }, [auth.activeCompanyId]);

  useEffect(() => {
    setCompanies(auth.companies ?? []);
  }, [auth.companies]);

  const loadCompanies = useCallback(async () => {
    try {
      const list = await api.listCompanies(auth.token);
      setCompanies(list);
      return list;
    } catch {
      return [] as CompanyOption[];
    }
  }, [auth.token]);

  const loadCompanyBusinessTypes = useCallback(async () => {
    try {
      const options = await api.listCompanyBusinessTypes(auth.token);
      setCompanyBusinessTypes(options);
      return options;
    } catch {
      setCompanyBusinessTypes([]);
      return [] as CompanyBusinessTypeOption[];
    }
  }, [auth.token]);

  useEffect(() => {
    void loadProfile();
    void loadCompanyBusinessTypes();
  }, [auth.token, loadCompanyBusinessTypes, loadProfile]);

  const handleSignOut = async () => {
    isActiveRef.current = false;
    closeDrawer();
    setStackRoute(null);
    setDrawerRoute('dashboard');
    await onLogout();
  };

  const applyCompanySwitch = useCallback(
    async (companyId: number, switchId: number) => {
      const startedAt = Date.now();
      const fromCompanyId = activeCompanyId ?? auth.activeCompanyId;
      debugLog.info('company', `Switch start ${fromCompanyId ?? '—'} → ${companyId}`, { switchId });

      setActiveCompanyId(companyId);
      setActiveCompanyIdState(companyId);
      setDrawerRoute('dashboard');
      setStackRoute(null);

      const latestCompanies = companies.length > 0 ? companies : await loadCompanies();
      if (switchId !== switchSeqRef.current) {
        debugLog.warn('company', `Switch superseded before save (${companyId})`, { switchId });
        return;
      }

      await onSubscriptionChanged({
        ...auth,
        activeCompanyId: companyId,
        companies: latestCompanies,
      });

      if (switchId !== switchSeqRef.current) {
        debugLog.warn('company', `Switch superseded after save (${companyId})`, { switchId });
        return;
      }

      debugLog.info('company', `Switch done → ${companyId}`, {
        switchId,
        ms: Date.now() - startedAt,
      });
    },
    [activeCompanyId, auth, companies, loadCompanies, onSubscriptionChanged],
  );

  const switchCompany = async (companyId: number) => {
    if (companyId === activeCompanyId && pendingCompanyIdRef.current == null) {
      return;
    }

    pendingCompanyIdRef.current = companyId;
    if (switchInFlightRef.current) {
      debugLog.debug('company', `Queued switch → ${companyId}`);
      return;
    }

    switchInFlightRef.current = true;
    setSwitchingCompany(true);
    const previousCompanyId = activeCompanyId ?? auth.activeCompanyId;

    try {
      while (pendingCompanyIdRef.current != null) {
        const targetCompanyId = pendingCompanyIdRef.current;
        pendingCompanyIdRef.current = null;
        const switchId = ++switchSeqRef.current;

        try {
          await applyCompanySwitch(targetCompanyId, switchId);
        } catch (err) {
          debugLog.error('company', 'Switch failed', {
            companyId: targetCompanyId,
            detail: err instanceof Error ? err.message : 'Could not switch company',
          });
          appAlert('Switch failed', err instanceof Error ? err.message : 'Could not switch company');
          if (previousCompanyId != null) {
            setActiveCompanyId(previousCompanyId);
            setActiveCompanyIdState(previousCompanyId);
          }
          pendingCompanyIdRef.current = null;
          break;
        }
      }
    } finally {
      switchInFlightRef.current = false;
      setSwitchingCompany(false);
      closeDrawer();
    }
  };

  const createCompany = async (name: string, businessTypeId: number) => {
    setSwitchingCompany(true);
    try {
      const created = await api.createCompany(auth.token, { name, businessTypeId });
      const merged = (() => {
        const map = new Map<number, CompanyOption>();
        [...companies, created].forEach((company) => map.set(company.id, company));
        return Array.from(map.values());
      })();
      setCompanies(merged);
      await onSubscriptionChanged({
        ...auth,
        activeCompanyId: created.id,
        companies: merged,
      });
      setActiveCompanyId(created.id);
      setActiveCompanyIdState(created.id);
      setDrawerRoute('dashboard');
      setStackRoute(null);
      await loadProfile(true);
      const synced = await loadCompanies();
      if (synced.length > 0) {
        await onSubscriptionChanged({
          ...auth,
          activeCompanyId: created.id,
          companies: synced,
        });
      }
    } catch (err) {
      appAlert('Create failed', err instanceof Error ? err.message : 'Could not create company');
    } finally {
      setSwitchingCompany(false);
      closeDrawer();
    }
  };

  const promptMembershipRequired = () => {
    appAlert(
      'Membership Required',
      'Please select a membership plan before using this feature.',
    );
  };

  const promptOwnerRequired = () => {
    appAlert('Owner only', 'Only the account owner can access this section.');
  };

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const navigateDrawer = (route: DrawerRoute) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }

    setDrawerRoute(route);
    setStackRoute(null);
    setSelectedCustomerId(undefined);
    setEditingCustomerId(undefined);
    setSelectedVendorId(undefined);
    setEditingVendorId(undefined);
    setSelectedProductId(undefined);
    setEditingProductId(undefined);
    setSelectedSaleId(undefined);
    setEditingSaleId(undefined);
    setSelectedPurchaseId(undefined);
    setEditingPurchaseId(undefined);
    setInitialReminderCustomerId(undefined);
  };

  const openStack = (route: StackRoute) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }

    setStackRoute(route);
    closeDrawer();
  };

  const closeStack = () => {
    if (stackRoute === 'customer-form' && selectedCustomerId != null) {
      setStackRoute('customer-detail');
      setEditingCustomerId(undefined);
      return;
    }

    if (stackRoute === 'vendor-form' && selectedVendorId != null) {
      setStackRoute('vendor-detail');
      setEditingVendorId(undefined);
      return;
    }

    if (stackRoute === 'product-form' && selectedProductId != null) {
      setStackRoute('product-detail');
      setEditingProductId(undefined);
      return;
    }

    if (stackRoute === 'sale-form' && selectedSaleId != null) {
      setStackRoute('sale-detail');
      setEditingSaleId(undefined);
      return;
    }

    if (stackRoute === 'receive-payment' && selectedSaleId != null) {
      setStackRoute('sale-detail');
      return;
    }

    if (stackRoute === 'purchase-form' && selectedPurchaseId != null) {
      setStackRoute('purchase-detail');
      setEditingPurchaseId(undefined);
      return;
    }

    if (stackRoute === 'make-payment' && selectedPurchaseId != null) {
      setStackRoute('purchase-detail');
      return;
    }

    if (stackRoute === 'team-user-form') {
      setStackRoute('team-users');
      return;
    }

    if (stackRoute === 'team-user-detail') {
      setStackRoute('team-users');
      setSelectedTeamUserId(undefined);
      return;
    }

    if (stackRoute === 'reminder-form') {
      setStackRoute(null);
      setEditingReminderId(undefined);
      setInitialReminderCustomerId(undefined);
      return;
    }

    setStackRoute(null);
    setSelectedCustomerId(undefined);
    setEditingCustomerId(undefined);
    setSelectedVendorId(undefined);
    setEditingVendorId(undefined);
    setSelectedProductId(undefined);
    setEditingProductId(undefined);
    setSelectedSaleId(undefined);
    setEditingSaleId(undefined);
    setSelectedPurchaseId(undefined);
    setEditingPurchaseId(undefined);
    setSelectedTeamUserId(undefined);
  };

  const openTeamUsers = () => {
    if (!isOwner) {
      promptOwnerRequired();
      return;
    }
    openStack('team-users');
  };

  const openTeamUserForm = () => {
    openStack('team-user-form');
  };

  const openTeamUserDetail = (userId: number) => {
    setSelectedTeamUserId(userId);
    openStack('team-user-detail');
  };

  const openActivityLog = () => {
    if (!isOwner) {
      promptOwnerRequired();
      return;
    }
    openStack('activity-log');
  };

  const openCreateCustomer = () => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedCustomerId(undefined);
    setEditingCustomerId(undefined);
    openStack('customer-form');
  };

  const openCustomerDetail = (customerId: number) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedCustomerId(customerId);
    setEditingCustomerId(undefined);
    openStack('customer-detail');
  };

  const openEditCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setEditingCustomerId(customerId);
    openStack('customer-form');
  };

  const openCreateVendor = () => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedVendorId(undefined);
    setEditingVendorId(undefined);
    openStack('vendor-form');
  };

  const openVendorDetail = (vendorId: number) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedVendorId(vendorId);
    setEditingVendorId(undefined);
    openStack('vendor-detail');
  };

  const openEditVendor = (vendorId: number) => {
    setSelectedVendorId(vendorId);
    setEditingVendorId(vendorId);
    openStack('vendor-form');
  };

  const openCreateProduct = () => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedProductId(undefined);
    setEditingProductId(undefined);
    openStack('product-form');
  };

  const openProductDetail = (productId: number) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedProductId(productId);
    setEditingProductId(undefined);
    openStack('product-detail');
  };

  const openEditProduct = (productId: number) => {
    setSelectedProductId(productId);
    setEditingProductId(productId);
    openStack('product-form');
  };

  const openCreateSale = () => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedSaleId(undefined);
    setEditingSaleId(undefined);
    openStack('sale-form');
  };

  const openEditSale = (saleId: number) => {
    setSelectedSaleId(saleId);
    setEditingSaleId(saleId);
    openStack('sale-form');
  };

  const openSaleDetail = (saleId: number) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedSaleId(saleId);
    setEditingSaleId(undefined);
    openStack('sale-detail');
  };

  const openReceivePayment = (saleId: number) => {
    setSelectedSaleId(saleId);
    openStack('receive-payment');
  };

  const openCreatePurchase = () => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedPurchaseId(undefined);
    setEditingPurchaseId(undefined);
    openStack('purchase-form');
  };

  const openEditPurchase = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    setEditingPurchaseId(purchaseId);
    openStack('purchase-form');
  };

  const openPurchaseDetail = (purchaseId: number) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setSelectedPurchaseId(purchaseId);
    setEditingPurchaseId(undefined);
    openStack('purchase-detail');
  };

  const openMakePayment = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    openStack('make-payment');
  };

  const openCreateReminder = () => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setEditingReminderId(undefined);
    setInitialReminderCustomerId(undefined);
    openStack('reminder-form');
  };

  const openCreateReminderForCustomer = (customerId: number) => {
    if (requiresSubscription) {
      promptMembershipRequired();
      return;
    }
    setEditingReminderId(undefined);
    setInitialReminderCustomerId(customerId);
    openStack('reminder-form');
  };

  const openEditReminder = (reminderId: number) => {
    setEditingReminderId(reminderId);
    setInitialReminderCustomerId(undefined);
    openStack('reminder-form');
  };

  const handleSubscribed = async () => {
    await loadProfile(true);
  };

  const headerTitle = () => {
    if (requiresSubscription) return 'Membership Plan';

    if (stackRoute === 'account') return 'My Account';
    if (stackRoute === 'change-pin') return 'Change Login PIN';
    if (stackRoute === 'subscription') return 'Subscription';
    if (stackRoute === 'customer-detail') return 'Customer';
    if (stackRoute === 'customer-form') {
      return editingCustomerId == null ? 'Add Customer' : 'Edit Customer';
    }
    if (stackRoute === 'vendor-detail') return 'Vendor';
    if (stackRoute === 'vendor-form') {
      return editingVendorId == null ? 'Add Vendor' : 'Edit Vendor';
    }
    if (stackRoute === 'sale-detail') return 'Sale';
    if (stackRoute === 'sale-form') {
      return editingSaleId == null ? 'New Sale' : 'Edit Sale';
    }
    if (stackRoute === 'receive-payment') return 'Receive Payment';
    if (stackRoute === 'purchase-detail') return 'Purchase';
    if (stackRoute === 'purchase-form') {
      return editingPurchaseId == null ? 'New Purchase' : 'Edit Purchase';
    }
    if (stackRoute === 'make-payment') return 'Make Payment';
    if (stackRoute === 'team-users') return 'Team Users';
    if (stackRoute === 'team-user-form') return 'Add Team User';
    if (stackRoute === 'team-user-detail') return 'Team User';
    if (stackRoute === 'activity-log') return 'Activity Log';
    if (stackRoute === 'preferences') return 'Appearance';
    if (stackRoute === 'debug-log') return 'Debug Log';
    if (stackRoute === 'reminder-form') {
      return editingReminderId == null ? 'New Reminder' : 'Edit Reminder';
    }

    if (drawerRoute === 'dashboard') return 'Dashboard';
    if (drawerRoute === 'settings') return 'Settings';
    if (drawerRoute === 'customers') return 'Customers';
    if (drawerRoute === 'vendors') return 'Vendors';
    if (drawerRoute === 'products') return 'Products';
    if (drawerRoute === 'sales') return 'Sales';
    if (drawerRoute === 'purchases') return 'Purchases';
    if (drawerRoute === 'reminders') return 'Payment Reminders';
    if (drawerRoute === 'reports') return 'Business Intelligence';
    return 'Quick Books';
  };

  const headerSubtitle = () => {
    if (requiresSubscription) {
      return 'Select a plan to unlock the app';
    }
    if (drawerRoute === 'dashboard' && profile?.businessName) {
      return profile.businessName;
    }
    return undefined;
  };

  const renderContent = () => {
    if (requiresSubscription) {
      return (
        <SubscriptionScreen
          token={auth.token}
          status={profile?.subscriptionStatus === 'EXPIRED' ? 'EXPIRED' : 'NONE'}
          locked
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onSubscribed={handleSubscribed}
        />
      );
    }

    if (stackRoute === 'change-pin') {
      return (
        <ChangePinScreen
          token={auth.token}
          onBack={closeStack}
          embedded
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      );
    }

    if (stackRoute === 'subscription') {
      return (
        <SubscriptionScreen
          token={auth.token}
          status={profile?.subscriptionStatus ?? 'NONE'}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onSubscribed={handleSubscribed}
        />
      );
    }

    if (stackRoute === 'team-users') {
      return (
        <TeamUsersScreen
          token={auth.token}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onAddUser={openTeamUserForm}
          onOpenUser={openTeamUserDetail}
        />
      );
    }

    if (stackRoute === 'team-user-form') {
      return (
        <TeamUserFormScreen
          token={auth.token}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onSaved={() => {
            setStackRoute('team-users');
          }}
        />
      );
    }

    if (stackRoute === 'team-user-detail' && selectedTeamUserId != null) {
      return (
        <TeamUserDetailScreen
          token={auth.token}
          userId={selectedTeamUserId}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onDeleted={() => {
            setStackRoute('team-users');
            setSelectedTeamUserId(undefined);
          }}
        />
      );
    }

    if (stackRoute === 'activity-log') {
      return (
        <ActivityLogScreen
          token={auth.token}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      );
    }

    if (stackRoute === 'preferences') {
      return (
        <PreferencesScreen
          token={auth.token}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      );
    }

    if (stackRoute === 'debug-log') {
      return <DebugLogScreen onBack={closeStack} />;
    }

    if (stackRoute === 'account') {
      return (
        <AccountScreen
          token={auth.token}
          profile={profile}
          loading={profileLoading}
          error={profileError}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onSettingsSaved={setProfile}
          onChangePin={() => openStack('change-pin')}
          onSubscription={() => openStack('subscription')}
          onManageTeam={openTeamUsers}
          onActivityLog={openActivityLog}
          isOwner={isOwner}
        />
      );
    }

    if (stackRoute === 'customer-detail' && selectedCustomerId != null) {
      return (
        <CustomerDetailScreen
          token={auth.token}
          customerId={selectedCustomerId}
          businessName={profile?.businessName}
          onEdit={() => openEditCustomer(selectedCustomerId)}
          onDeleted={closeStack}
          onOpenSale={openSaleDetail}
          onCreateReminder={() => openCreateReminderForCustomer(selectedCustomerId)}
          canEdit={canCustomerEdit}
          canDelete={canCustomerDelete}
          canCreateReminder={canReminderCreate}
        />
      );
    }

    if (stackRoute === 'customer-form') {
      return (
        <CustomerFormScreen
          token={auth.token}
          customerId={editingCustomerId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'vendor-detail' && selectedVendorId != null) {
      return (
        <VendorDetailScreen
          token={auth.token}
          vendorId={selectedVendorId}
          businessName={profile?.businessName}
          onEdit={() => openEditVendor(selectedVendorId)}
          onDeleted={closeStack}
          onOpenPurchase={openPurchaseDetail}
          canEdit={canVendorEdit}
          canDelete={canVendorDelete}
        />
      );
    }

    if (stackRoute === 'vendor-form') {
      return (
        <VendorFormScreen
          token={auth.token}
          vendorId={editingVendorId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'product-detail' && selectedProductId != null) {
      return (
        <ProductDetailScreen
          token={auth.token}
          productId={selectedProductId}
          onEdit={() => openEditProduct(selectedProductId)}
          onDeleted={closeStack}
          canEdit={canProductEdit}
          canDelete={canProductDelete}
        />
      );
    }

    if (stackRoute === 'product-form') {
      return (
        <ProductFormScreen
          token={auth.token}
          productId={editingProductId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'sale-detail' && selectedSaleId != null) {
      return (
        <SaleDetailScreen
          token={auth.token}
          saleId={selectedSaleId}
          businessName={profile?.businessName}
          onEdit={() => openEditSale(selectedSaleId)}
          onReceivePayment={() => openReceivePayment(selectedSaleId)}
          canEdit={canSaleEdit}
        />
      );
    }

    if (stackRoute === 'sale-form') {
      return (
        <SaleFormScreen
          token={auth.token}
          saleId={editingSaleId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'receive-payment' && selectedSaleId != null) {
      return (
        <ReceivePaymentScreen
          token={auth.token}
          saleId={selectedSaleId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'purchase-detail' && selectedPurchaseId != null) {
      return (
        <PurchaseDetailScreen
          token={auth.token}
          purchaseId={selectedPurchaseId}
          businessName={profile?.businessName}
          onEdit={() => openEditPurchase(selectedPurchaseId)}
          onMakePayment={() => openMakePayment(selectedPurchaseId)}
          canEdit={canPurchaseEdit}
        />
      );
    }

    if (stackRoute === 'purchase-form') {
      return (
        <PurchaseFormScreen
          token={auth.token}
          purchaseId={editingPurchaseId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'make-payment' && selectedPurchaseId != null) {
      return (
        <MakePaymentScreen
          token={auth.token}
          purchaseId={selectedPurchaseId}
          onSaved={closeStack}
        />
      );
    }

    if (stackRoute === 'reminder-form') {
      return (
        <PaymentReminderFormScreen
          token={auth.token}
          reminderId={editingReminderId}
          initialCustomerId={initialReminderCustomerId}
          onSaved={closeStack}
        />
      );
    }

    if (drawerRoute === 'dashboard') {
      return (
        <DashboardScreen
          token={auth.token}
          activeCompanyId={activeCompanyId}
          profile={profile}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onNewSale={openCreateSale}
          onNewPurchase={openCreatePurchase}
          onAddCustomer={openCreateCustomer}
          onOpenReports={canViewReports ? () => navigateDrawer('reports') : undefined}
          onNavigate={navigateDrawer}
          onOpenReminders={() => navigateDrawer('reminders')}
          onCreateReminder={openCreateReminder}
          quickActionKeys={dashboardQuickActions}
          workspaceRoutes={dashboardWorkspaceRoutes}
          canEditReminders={canReminderEdit}
          onSnoozeReminder={
            canReminderEdit
              ? async (reminderId, snoozedUntil) => {
                  await api.snoozePaymentReminder(auth.token, reminderId, { snoozedUntil });
                }
              : undefined
          }
          onCompleteReminder={
            canReminderEdit
              ? async (reminderId) => {
                  await api.completePaymentReminder(auth.token, reminderId);
                }
              : undefined
          }
        />
      );
    }

    if (drawerRoute === 'reports') {
      return (
        <ReportsScreen
          token={auth.token}
          activeCompanyId={activeCompanyId}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      );
    }

    if (drawerRoute === 'customers') {
      return (
        <CustomersScreen
          token={auth.token}
          onAddCustomer={openCreateCustomer}
          onOpenCustomer={openCustomerDetail}
          canCreate={canCustomerCreate}
        />
      );
    }

    if (drawerRoute === 'vendors') {
      return (
        <VendorsScreen
          token={auth.token}
          onAddVendor={openCreateVendor}
          onOpenVendor={openVendorDetail}
          canCreate={canVendorCreate}
        />
      );
    }

    if (drawerRoute === 'products') {
      return (
        <ProductsScreen
          token={auth.token}
          onAddProduct={openCreateProduct}
          onOpenProduct={openProductDetail}
          canCreate={canProductCreate}
        />
      );
    }

    if (drawerRoute === 'sales') {
      return (
        <SalesScreen
          token={auth.token}
          onAddSale={openCreateSale}
          onOpenSale={openSaleDetail}
          canCreate={canSaleCreate}
        />
      );
    }

    if (drawerRoute === 'purchases') {
      return (
        <PurchasesScreen
          token={auth.token}
          onAddPurchase={openCreatePurchase}
          onOpenPurchase={openPurchaseDetail}
          canCreate={canPurchaseCreate}
        />
      );
    }

    if (drawerRoute === 'reminders') {
      return (
        <PaymentRemindersScreen
          token={auth.token}
          onAddReminder={openCreateReminder}
          onEditReminder={openEditReminder}
          canCreate={canReminderCreate}
          canEdit={canReminderEdit}
          canDelete={canReminderDelete}
        />
      );
    }

    if (drawerRoute === 'settings') {
      return (
        <SettingsScreen
          profile={profile}
          loading={profileLoading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onOpenAccount={() => openStack('account')}
          onOpenPreferences={() => openStack('preferences')}
          onOpenDebugLog={() => openStack('debug-log')}
          onManageTeam={openTeamUsers}
          onActivityLog={openActivityLog}
          isOwner={isOwner}
        />
      );
    }

    return null;
  };

  return (
    <DrawerLayout
      open={drawerOpen}
      activeRoute={drawerRoute}
      profile={profile}
      companies={companies}
      businessTypes={companyBusinessTypes}
      activeCompanyId={activeCompanyId}
      switchingCompany={switchingCompany}
      navItems={drawerNavItems}
      canManageCompanies={allowManageCompanies}
      onClose={closeDrawer}
      onNavigate={navigateDrawer}
      onSwitchCompany={switchCompany}
      onCreateCompany={createCompany}
      onSignOut={handleSignOut}
    >
      <View style={styles.shell}>
        <AppHeader
          title={headerTitle()}
          subtitle={headerSubtitle()}
          onMenuPress={openDrawer}
          onBackPress={!requiresSubscription && stackRoute ? closeStack : undefined}
        />
        <View style={styles.body}>{renderContent()}</View>
      </View>
    </DrawerLayout>
  );
}

function createStyles(theme: AppTheme) {
  return {
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
  },

  };
}
