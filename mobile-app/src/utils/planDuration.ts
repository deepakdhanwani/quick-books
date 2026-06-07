export function getPlanDurationLabel(duration?: string) {
  switch (duration) {
    case 'MONTHLY':
      return 'Monthly';
    case 'QUARTERLY':
      return 'Quarterly';
    case 'HALF_YEARLY':
      return 'Half Yearly';
    case 'ANNUAL':
      return 'Annual';
    default:
      return duration ?? 'Plan';
  }
}

export function formatCurrency(amount?: number) {
  if (amount == null) {
    return '—';
  }
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(value?: string) {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
