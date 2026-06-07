import { useCallback, useEffect, useRef, useState } from 'react';
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
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
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
import { api, SubscriberAccountProfile, SubscriberAuthResponse } from '../services/api';
import { colors } from '../theme/colors';
import { DrawerRoute, PLACEHOLDER_TITLES, StackRoute } from './types';

type AppShellProps = {
  auth: SubscriberAuthResponse;
  onLogout: () => void | Promise<void>;
  onSubscriptionChanged: (auth: SubscriberAuthResponse) => void | Promise<void>;
};

export function AppShell({ auth, onLogout, onSubscriptionChanged }: AppShellProps) {
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

  const [profile, setProfile] = useState<SubscriberAccountProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isActiveRef = useRef(true);

  const hasActiveSubscription = profile?.subscriptionStatus === 'ACTIVE';
  const requiresSubscription = profile != null && !hasActiveSubscription;
  const isOwner =
    (profile?.owner ?? auth.userType !== 'STAFF') &&
    (profile?.userType ?? auth.userType ?? 'OWNER') !== 'STAFF';

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
        await onSubscriptionChanged({
          ...auth,
          subscriptionStatus: data.subscriptionStatus,
          requiresSubscription: data.subscriptionStatus !== 'ACTIVE',
          userName: data.loggedInUserName ?? auth.userName,
          userType: data.userType ?? auth.userType,
          canChangePin: data.canChangePin ?? auth.canChangePin,
        });
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Could not load account details');
      } finally {
        if (!isPullRefresh) {
          setProfileLoading(false);
        }
      }
    },
    [auth, onSubscriptionChanged],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile(true);
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => {
    isActiveRef.current = true;
    void loadProfile();
    return () => {
      isActiveRef.current = false;
    };
  }, [loadProfile]);

  const handleSignOut = async () => {
    isActiveRef.current = false;
    closeDrawer();
    setStackRoute(null);
    setDrawerRoute('dashboard');
    await onLogout();
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

    if (drawerRoute === 'dashboard') return 'Dashboard';
    if (drawerRoute === 'settings') return 'Settings';
    if (drawerRoute === 'customers') return 'Customers';
    if (drawerRoute === 'vendors') return 'Vendors';
    if (drawerRoute === 'products') return 'Products';
    if (drawerRoute === 'sales') return 'Sales';
    if (drawerRoute === 'purchases') return 'Purchases';
    return PLACEHOLDER_TITLES[drawerRoute as keyof typeof PLACEHOLDER_TITLES] ?? 'Quick Books';
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
          onEdit={() => openEditCustomer(selectedCustomerId)}
          onDeleted={closeStack}
          onOpenSale={openSaleDetail}
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
          onEdit={() => openEditVendor(selectedVendorId)}
          onDeleted={closeStack}
          onOpenPurchase={openPurchaseDetail}
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
          onEdit={() => openEditSale(selectedSaleId)}
          onReceivePayment={() => openReceivePayment(selectedSaleId)}
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
          onEdit={() => openEditPurchase(selectedPurchaseId)}
          onMakePayment={() => openMakePayment(selectedPurchaseId)}
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

    if (drawerRoute === 'dashboard') {
      return (
        <DashboardScreen profile={profile} refreshing={refreshing} onRefresh={handleRefresh} />
      );
    }

    if (drawerRoute === 'customers') {
      return (
        <CustomersScreen
          token={auth.token}
          onAddCustomer={openCreateCustomer}
          onOpenCustomer={openCustomerDetail}
        />
      );
    }

    if (drawerRoute === 'vendors') {
      return (
        <VendorsScreen
          token={auth.token}
          onAddVendor={openCreateVendor}
          onOpenVendor={openVendorDetail}
        />
      );
    }

    if (drawerRoute === 'products') {
      return (
        <ProductsScreen
          token={auth.token}
          onAddProduct={openCreateProduct}
          onOpenProduct={openProductDetail}
        />
      );
    }

    if (drawerRoute === 'sales') {
      return (
        <SalesScreen
          token={auth.token}
          onAddSale={openCreateSale}
          onOpenSale={openSaleDetail}
        />
      );
    }

    if (drawerRoute === 'purchases') {
      return (
        <PurchasesScreen
          token={auth.token}
          onAddPurchase={openCreatePurchase}
          onOpenPurchase={openPurchaseDetail}
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
          onManageTeam={openTeamUsers}
          onActivityLog={openActivityLog}
          isOwner={isOwner}
        />
      );
    }

    const title = PLACEHOLDER_TITLES[drawerRoute as keyof typeof PLACEHOLDER_TITLES];
    return (
      <PlaceholderScreen
        title={title}
        description={`Track and manage ${title.toLowerCase()} from one place.`}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  };

  return (
    <DrawerLayout
      open={drawerOpen}
      activeRoute={drawerRoute}
      profile={profile}
      onClose={closeDrawer}
      onNavigate={navigateDrawer}
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

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
});
