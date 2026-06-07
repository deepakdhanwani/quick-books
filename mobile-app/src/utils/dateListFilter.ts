export type DateFilterMode = 'today' | 'week' | 'month' | 'range' | 'none';

export type AppliedDateFilter = {
  mode: DateFilterMode;
  fromDate?: string;
  toDate?: string;
};

export type DateFilterParams = {
  fromDate?: string;
  toDate?: string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultDateFilter(): AppliedDateFilter {
  const today = toIsoDate(new Date());
  return { mode: 'today', fromDate: today, toDate: today };
}

export function getClearedDateFilter(): AppliedDateFilter {
  return { mode: 'none' };
}

export function isDateFilterActive(filter: AppliedDateFilter): boolean {
  return filter.mode !== 'none';
}

export function resolveDateFilterParams(filter: AppliedDateFilter): DateFilterParams {
  if (filter.mode === 'none') {
    return {};
  }

  if (filter.mode === 'today') {
    const today = toIsoDate(new Date());
    return { fromDate: today, toDate: today };
  }

  if (filter.mode === 'week') {
    return getWeekRange();
  }

  if (filter.mode === 'month') {
    return getMonthRange();
  }

  if (filter.mode === 'range' && filter.fromDate && filter.toDate) {
    return { fromDate: filter.fromDate, toDate: filter.toDate };
  }

  return {};
}

export function getDateFilterLabel(filter: AppliedDateFilter): string {
  const params = resolveDateFilterParams(filter);
  if (!params.fromDate && !params.toDate) {
    return 'All dates';
  }

  if (filter.mode === 'today') {
    return 'Today';
  }

  if (filter.mode === 'week') {
    return 'This week';
  }

  if (filter.mode === 'month') {
    return 'This month';
  }

  if (params.fromDate === params.toDate) {
    return formatShortDate(params.fromDate);
  }

  return `${formatShortDate(params.fromDate)} – ${formatShortDate(params.toDate)}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function validateRangeDates(fromDate: string, toDate: string): string | null {
  if (!isValidIsoDate(fromDate) || !isValidIsoDate(toDate)) {
    return 'Enter dates as YYYY-MM-DD';
  }

  if (fromDate > toDate) {
    return 'Start date must be on or before end date';
  }

  return null;
}

function getWeekRange(): DateFilterParams {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return { fromDate: toIsoDate(monday), toDate: toIsoDate(today) };
}

function getMonthRange(): DateFilterParams {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate: toIsoDate(firstDay), toDate: toIsoDate(today) };
}

function formatShortDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
