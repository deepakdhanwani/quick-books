import { CustomerType } from '../services/api';

export const CUSTOMER_TYPE_OPTIONS: { value: CustomerType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'OTHER', label: 'Other Business' },
];

export function isBusinessCustomerType(type?: CustomerType) {
  return type === 'COMPANY' || type === 'SHOP' || type === 'OTHER';
}

export function getCustomerTypeLabel(type?: CustomerType) {
  return CUSTOMER_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Not specified';
}

export function getBusinessNameLabel(type?: CustomerType) {
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
