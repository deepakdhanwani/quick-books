export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type DiscountScope = 'ALL' | 'SPECIFIC';

export const DISCOUNT_TYPE_OPTIONS: { label: string; value: DiscountType }[] = [
  { label: 'Percentage', value: 'PERCENTAGE' },
  { label: 'Fixed amount', value: 'FIXED' },
];

export const DISCOUNT_SCOPE_OPTIONS: { label: string; value: DiscountScope }[] = [
  { label: 'All subscribers', value: 'ALL' },
  { label: 'Specific subscribers', value: 'SPECIFIC' },
];

export function formatDiscountType(type: DiscountType | string): string {
  if (type === 'PERCENTAGE') return 'Percentage';
  if (type === 'FIXED') return 'Fixed';
  return String(type);
}

export function formatDiscountScope(scope: DiscountScope | string): string {
  if (scope === 'ALL') return 'All subscribers';
  if (scope === 'SPECIFIC') return 'Specific subscribers';
  return String(scope);
}

export function formatDiscountValue(type: DiscountType | string, value: number): string {
  if (type === 'PERCENTAGE') {
    return `${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  }
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatValidity(validFrom?: string | null, validTo?: string | null): string {
  if (!validFrom && !validTo) return 'No expiry';
  if (validFrom && validTo) return `${formatDate(validFrom)} – ${formatDate(validTo)}`;
  if (validFrom) return `From ${formatDate(validFrom)}`;
  return `Until ${formatDate(validTo!)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function parseOptionalDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error('Enter dates as YYYY-MM-DD');
  }
  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Enter a valid date');
  }
  return trimmed;
}
