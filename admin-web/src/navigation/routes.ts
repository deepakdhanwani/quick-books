export type AdminRoute =
  | 'dashboard'
  | 'business-types'
  | 'subscribers'
  | 'plans'
  | 'taxes'
  | 'discounts'
  | 'reports'
  | 'settings';

export type NavItem = {
  id: AdminRoute;
  label: string;
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'business-types', label: 'Business Types', icon: '🏪' },
  { id: 'subscribers', label: 'Subscribers', icon: '👥' },
  { id: 'plans', label: 'Subscription Plans', icon: '📋' },
  { id: 'taxes', label: 'Taxes', icon: '💰' },
  { id: 'discounts', label: 'Discounts', icon: '🏷' },
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];
