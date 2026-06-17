import { toIsoDate, validateRangeDates } from './dateListFilter';

export type LedgerExportPeriodMode = 'monthYear' | 'financialYear' | 'customRange';

export type LedgerExportPeriod = {
  mode: LedgerExportPeriodMode;
  month?: number;
  year?: number;
  financialYearStart?: number;
  fromDate?: string;
  toDate?: string;
};

export function getMonthYearRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  const monthText = String(month).padStart(2, '0');
  return {
    fromDate: `${year}-${monthText}-01`,
    toDate: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getFinancialYearRange(startYear: number) {
  return {
    fromDate: `${startYear}-04-01`,
    toDate: `${startYear + 1}-03-31`,
  };
}

export function financialYearLabel(startYear: number) {
  const end = String(startYear + 1).slice(-2);
  return `FY ${startYear}-${end}`;
}

export function resolveLedgerExportPeriod(period: LedgerExportPeriod) {
  if (period.mode === 'monthYear') {
    if (!period.month || !period.year) {
      throw new Error('Select month and year');
    }
    return getMonthYearRange(period.year, period.month);
  }

  if (period.mode === 'financialYear') {
    if (!period.financialYearStart) {
      throw new Error('Select financial year');
    }
    return getFinancialYearRange(period.financialYearStart);
  }

  if (period.mode === 'customRange') {
    const fromDate = period.fromDate?.trim() ?? '';
    const toDate = period.toDate?.trim() ?? '';
    const validationError = validateRangeDates(fromDate, toDate);
    if (validationError) {
      throw new Error(validationError);
    }
    return { fromDate, toDate };
  }

  throw new Error('Select an export period');
}

export function defaultLedgerExportPeriod(): LedgerExportPeriod {
  const now = new Date();
  return {
    mode: 'monthYear',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function ledgerExportPeriodCaption(period: LedgerExportPeriod) {
  try {
    const range = resolveLedgerExportPeriod(period);
    if (period.mode === 'monthYear' && period.month && period.year) {
      const label = new Date(period.year, period.month - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
      return label;
    }
    if (period.mode === 'financialYear' && period.financialYearStart) {
      return financialYearLabel(period.financialYearStart);
    }
    return `${range.fromDate} to ${range.toDate}`;
  } catch {
    return 'Select period';
  }
}

export function currentFinancialYearStart(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

export function recentFinancialYearOptions(count = 6) {
  const start = currentFinancialYearStart();
  return Array.from({ length: count }, (_, index) => start - index);
}

export function recentMonthYearOptions(count = 12) {
  const options: { month: number; year: number; label: string }[] = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let index = 0; index < count; index += 1) {
    const month = cursor.getMonth() + 1;
    const year = cursor.getFullYear();
    options.push({
      month,
      year,
      label: cursor.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    });
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return options;
}

export function todayIso() {
  return toIsoDate(new Date());
}
