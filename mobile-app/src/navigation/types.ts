import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type DrawerRoute =
  | 'dashboard'
  | 'customers'
  | 'vendors'
  | 'products'
  | 'sales'
  | 'purchases'
  | 'reports'
  | 'settings';

export type StackRoute =
  | 'account'
  | 'change-pin'
  | 'subscription'
  | 'customer-detail'
  | 'customer-form'
  | 'vendor-detail'
  | 'vendor-form'
  | 'product-detail'
  | 'product-form'
  | 'sale-detail'
  | 'sale-form'
  | 'receive-payment'
  | 'purchase-detail'
  | 'purchase-form'
  | 'make-payment'
  | 'team-users'
  | 'team-user-form'
  | 'team-user-detail'
  | 'activity-log';

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
  { id: 'products', label: 'Products', icon: 'cube-outline' },
  { id: 'sales', label: 'Sales', icon: 'cart-outline' },
  { id: 'purchases', label: 'Purchases', icon: 'bag-handle-outline' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export const PLACEHOLDER_TITLES: Record<Exclude<DrawerRoute, 'dashboard' | 'settings' | 'customers' | 'vendors' | 'products' | 'sales' | 'purchases'>, string> = {
  reports: 'Reports',
};
