import type { OpeningBalanceNature } from '../services/api';

export function formatOpeningBalanceLabel(
  mode: 'customer' | 'vendor',
  nature: OpeningBalanceNature,
) {
  if (mode === 'customer') {
    return nature === 'TO_RECEIVE' ? 'Customer owes you' : 'You owe customer';
  }
  return nature === 'TO_PAY' ? 'You owe vendor' : 'Vendor owes you';
}

export function defaultOpeningBalanceNature(mode: 'customer' | 'vendor'): OpeningBalanceNature {
  return mode === 'customer' ? 'TO_RECEIVE' : 'TO_PAY';
}

export function formatOpeningBalanceAmount(amount: number) {
  if (!amount) return '0';
  return String(amount);
}
