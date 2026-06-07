import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { VendorDetailScreen } from '../screens/VendorDetailScreen';
import { VendorFormScreen } from '../screens/VendorFormScreen';
import { VendorsScreen } from '../screens/VendorsScreen';
import { api, SubscriberAccountProfile, SubscriberAuthResponse } from '../services/api';
import { colors } from '../theme/colors';
import { DrawerRoute, PLACEHOLDER_TITLES, StackRoute } from './types';

type AppShellProps = {
  auth: SubscriberAuthResponse;
  onLogout: () => void;
};

export function AppShell({ auth, onLogout }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRoute, setDrawerRoute] = useState<DrawerRoute>('dashboard');
  const [stackRoute, setStackRoute] = useState<StackRoute | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [editingCustomerId, setEditingCustomerId] = useState<number | undefined>(undefined);
  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(undefined);
  const [editingVendorId, setEditingVendorId] = useState<number | undefined>(undefined);

  const [profile, setProfile] = useState<SubscriberAccountProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh) {
        setProfileLoading(true);
      }
      setProfileError('');
      try {
        const data = await api.getAccountProfile(auth.token);
        setProfile(data);
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Could not load account details');
      } finally {
        if (!isPullRefresh) {
          setProfileLoading(false);
        }
      }
    },
    [auth.token],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile(true);
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const navigateDrawer = (route: DrawerRoute) => {
    setDrawerRoute(route);
    setStackRoute(null);
    setSelectedCustomerId(undefined);
    setEditingCustomerId(undefined);
    setSelectedVendorId(undefined);
    setEditingVendorId(undefined);
  };

  const openStack = (route: StackRoute) => {
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

    setStackRoute(null);
    setSelectedCustomerId(undefined);
    setEditingCustomerId(undefined);
    setSelectedVendorId(undefined);
    setEditingVendorId(undefined);
  };

  const openCreateCustomer = () => {
    setSelectedCustomerId(undefined);
    setEditingCustomerId(undefined);
    openStack('customer-form');
  };

  const openCustomerDetail = (customerId: number) => {
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
    setSelectedVendorId(undefined);
    setEditingVendorId(undefined);
    openStack('vendor-form');
  };

  const openVendorDetail = (vendorId: number) => {
    setSelectedVendorId(vendorId);
    setEditingVendorId(undefined);
    openStack('vendor-detail');
  };

  const openEditVendor = (vendorId: number) => {
    setSelectedVendorId(vendorId);
    setEditingVendorId(vendorId);
    openStack('vendor-form');
  };

  const headerTitle = () => {
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

    if (drawerRoute === 'dashboard') return 'Dashboard';
    if (drawerRoute === 'settings') return 'Settings';
    if (drawerRoute === 'customers') return 'Customers';
    if (drawerRoute === 'vendors') return 'Vendors';
    return PLACEHOLDER_TITLES[drawerRoute as keyof typeof PLACEHOLDER_TITLES] ?? 'Quick Books';
  };

  const headerSubtitle = () => {
    if (drawerRoute === 'dashboard' && profile?.businessName) {
      return profile.businessName;
    }
    return undefined;
  };

  const renderContent = () => {
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
      const status = profile?.subscriptionStatus === 'EXPIRED' ? 'EXPIRED' : 'NONE';
      return (
        <SubscriptionScreen status={status} refreshing={refreshing} onRefresh={handleRefresh} />
      );
    }

    if (stackRoute === 'account') {
      return (
        <AccountScreen
          profile={profile}
          loading={profileLoading}
          error={profileError}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onChangePin={() => openStack('change-pin')}
          onSubscription={() => openStack('subscription')}
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

    if (drawerRoute === 'settings') {
      return (
        <SettingsScreen
          profile={profile}
          loading={profileLoading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onOpenAccount={() => openStack('account')}
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
      onSignOut={onLogout}
    >
      <View style={styles.shell}>
        <AppHeader
          title={headerTitle()}
          subtitle={headerSubtitle()}
          onMenuPress={stackRoute ? undefined : openDrawer}
          onBackPress={stackRoute ? closeStack : undefined}
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
