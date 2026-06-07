import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type DrawerRoute =
  | 'dashboard'
  | 'customers'
  | 'vendors'
  | 'sales'
  | 'purchases'
  | 'pending-payments'
  | 'reports'
  | 'settings';

export type StackRoute =
  | 'account'
  | 'change-pin'
  | 'subscription'
  | 'customer-detail'
  | 'customer-form'
  | 'vendor-detail'
  | 'vendor-form';

export type AppRoute = DrawerRoute | StackRoute;

export type DrawerNavItem = {
  id: DrawerRoute;
  label: string;
  icon: IoniconName;
};

export const DRAWER_NAV_ITEMS: DrawerNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { id: 'customers', label: 'Customers', icon: 'people-outline' },
  { id: 'vendors', label: 'Vendors', icon: 'storefront-outline' },
  { id: 'sales', label: 'Sales', icon: 'cart-outline' },
  { id: 'purchases', label: 'Purchases', icon: 'bag-handle-outline' },
  { id: 'pending-payments', label: 'Pending Payments', icon: 'time-outline' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export const PLACEHOLDER_TITLES: Record<Exclude<DrawerRoute, 'dashboard' | 'settings' | 'customers' | 'vendors'>, string> = {
  sales: 'Sales',
  purchases: 'Purchases',
  'pending-payments': 'Pending Payments',
  reports: 'Reports',
};
