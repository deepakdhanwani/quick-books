import { CustomerType, Vendor } from '../services/api';

export type VendorType = CustomerType;

export function getVendorDisplayName(vendor: Pick<Vendor, 'name' | 'businessName'>) {
  return vendor.businessName?.trim() || vendor.name;
}

export const VENDOR_TYPE_OPTIONS: { value: VendorType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'OTHER', label: 'Other Business' },
];

export function isBusinessVendorType(type?: VendorType) {
  return type === 'COMPANY' || type === 'SHOP' || type === 'OTHER';
}

export function getVendorTypeLabel(type?: VendorType) {
  return VENDOR_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Not specified';
}

export function getBusinessNameLabel(type?: VendorType) {
  switch (type) {
    case 'COMPANY':
      return 'Company Name';
    case 'SHOP':
      return 'Shop Name';
    case 'OTHER':
      return 'Business Name';
    default:
      return 'Business Name';
  }
}
