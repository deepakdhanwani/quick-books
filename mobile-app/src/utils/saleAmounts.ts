export function parseAmount(value: string) {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatTaxAmountValue(amount: number) {
  return String(amount);
}

export function optionalAmountField(raw: string, parsed: number): number | undefined {
  return raw.trim() !== '' ? parsed : undefined;
}

export function optionalTaxAmountField(
  rawTaxAmount: string,
  taxEdited: boolean,
  effectiveTax: number,
): number | undefined {
  if (taxEdited || rawTaxAmount.trim() !== '') {
    return effectiveTax;
  }
  return undefined;
}

export function calculateTaxAmount(gross: number, discount: number, taxPercent: number) {
  const taxable = Math.max(gross - discount, 0);
  return Number(((taxable * taxPercent) / 100).toFixed(2));
}

export function calculateNetAmount(gross: number, discount: number, taxAmount: number) {
  const taxable = Math.max(gross - discount, 0);
  return Number((taxable + taxAmount).toFixed(2));
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

export function getPaymentStatusLabel(status?: string) {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'PARTIAL':
      return 'Partial';
    case 'UNPAID':
      return 'Unpaid';
    default:
      return status ?? '—';
  }
}

export function getPaymentStatusColor(status?: string) {
  switch (status) {
    case 'PAID':
      return '#22c55e';
    case 'PARTIAL':
      return '#f59e0b';
    default:
      return '#94a3b8';
  }
}

export function getPaymentModeLabel(mode?: string) {
  switch (mode) {
    case 'CASH':
      return 'Cash';
    case 'UPI':
      return 'UPI';
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    default:
      return mode ?? '—';
  }
}

export function getPaymentDetailsLabel(mode?: string) {
  switch (mode) {
    case 'CASH':
      return 'Cash received by / reference';
    case 'UPI':
      return 'UPI transaction ID';
    case 'BANK_TRANSFER':
      return 'Bank transfer reference';
    default:
      return 'Payment details';
  }
}
