import type { DrawerRoute } from '../navigation/types';
import type { CompanyCrud, ModuleCrud, StaffPermissions } from '../services/api';

export const CRUD_NONE: ModuleCrud = { view: false, create: false, edit: false, delete: false };
export const CRUD_FULL: ModuleCrud = { view: true, create: true, edit: true, delete: true };
export const CRUD_VIEW_ONLY: ModuleCrud = { view: true, create: false, edit: false, delete: false };

export const COMPANY_CRUD_FULL: CompanyCrud = { create: true, edit: true, delete: true };
export const COMPANY_CRUD_NONE: CompanyCrud = { create: false, edit: false, delete: false };

export type CrudModule = 'customers' | 'vendors' | 'sales' | 'purchases' | 'products' | 'reminders';

export const FULL_STAFF_PERMISSIONS: StaffPermissions = {
  companyIds: [],
  viewDashboard: true,
  viewReports: true,
  companies: COMPANY_CRUD_FULL,
  customers: CRUD_FULL,
  vendors: CRUD_FULL,
  sales: CRUD_FULL,
  purchases: CRUD_FULL,
  products: CRUD_FULL,
  reminders: CRUD_FULL,
};

export const DEFAULT_NEW_STAFF_PERMISSIONS: StaffPermissions = {
  companyIds: [],
  viewDashboard: true,
  viewReports: false,
  companies: COMPANY_CRUD_NONE,
  customers: CRUD_NONE,
  vendors: CRUD_NONE,
  sales: CRUD_NONE,
  purchases: CRUD_NONE,
  products: CRUD_NONE,
  reminders: CRUD_NONE,
};

export function moduleAny(module: ModuleCrud) {
  return module.view || module.create || module.edit || module.delete;
}

export function resolveStaffPermissions(
  isOwner: boolean,
  permissions?: StaffPermissions | null,
): StaffPermissions {
  if (isOwner) {
    return FULL_STAFF_PERMISSIONS;
  }
  return permissions ?? DEFAULT_NEW_STAFF_PERMISSIONS;
}

export function isSubscriberOwner(
  userType?: string | null,
  ownerFlag?: boolean | null,
): boolean {
  if (ownerFlag === true) {
    return true;
  }
  return (userType ?? 'OWNER') !== 'STAFF';
}

export function canModule(
  permissions: StaffPermissions,
  isOwner: boolean,
  module: CrudModule,
  action: keyof ModuleCrud,
): boolean {
  if (isOwner) {
    return true;
  }
  return permissions[module][action];
}

export function canCompany(
  permissions: StaffPermissions,
  isOwner: boolean,
  action: keyof CompanyCrud,
): boolean {
  if (isOwner) {
    return true;
  }
  return permissions.companies[action];
}

export function canAccessDrawerRoute(
  route: DrawerRoute,
  permissions: StaffPermissions,
  isOwner: boolean,
): boolean {
  if (isOwner) {
    return true;
  }
  switch (route) {
    case 'dashboard':
      return permissions.viewDashboard;
    case 'reports':
      return permissions.viewReports;
    case 'customers':
      return (
        moduleAny(permissions.customers) ||
        moduleAny(permissions.sales) ||
        moduleAny(permissions.reminders)
      );
    case 'vendors':
      return moduleAny(permissions.vendors) || moduleAny(permissions.purchases);
    case 'products':
      return (
        moduleAny(permissions.products) ||
        moduleAny(permissions.sales) ||
        moduleAny(permissions.purchases)
      );
    case 'sales':
      return permissions.sales.view || permissions.sales.create;
    case 'purchases':
      return permissions.purchases.view || permissions.purchases.create;
    case 'reminders':
      return permissions.reminders.view || permissions.reminders.create;
    case 'settings':
      return true;
    default:
      return false;
  }
}

export function canManageCompanies(permissions: StaffPermissions, isOwner: boolean) {
  return canCompany(permissions, isOwner, 'create');
}
