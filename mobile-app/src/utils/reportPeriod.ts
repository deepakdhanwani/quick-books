import type { QuickPeriodPreset } from '../components/bi/ReportPeriodBar';
import type { AppliedDateFilter } from './dateListFilter';
import { resolveDateFilterParams, toIsoDate } from './dateListFilter';

export function quickPresetToDateFilter(preset: QuickPeriodPreset): AppliedDateFilter {
  const today = new Date();
  const toDate = toIsoDate(today);

  if (preset === 'month') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return { mode: 'month', fromDate: toIsoDate(monthStart), toDate };
  }

  if (preset === '30d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { mode: 'range', fromDate: toIsoDate(from), toDate };
  }

  if (preset === '90d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 89);
    return { mode: 'range', fromDate: toIsoDate(from), toDate };
  }

  return { mode: 'month', ...resolveDateFilterParams({ mode: 'month' }) };
}

export function resolveReportPeriod(quickPreset: QuickPeriodPreset, dateFilter: AppliedDateFilter) {
  if (dateFilter.mode === 'quarterly' ||
      dateFilter.mode === 'halfYearly' ||
      dateFilter.mode === 'yearly' ||
      dateFilter.mode === 'lastYear' ||
      (dateFilter.mode === 'range' && !isQuickRange(quickPreset, dateFilter))) {
    return resolveDateFilterParams(dateFilter);
  }

  return resolveDateFilterParams(quickPresetToDateFilter(quickPreset));
}

function isQuickRange(preset: QuickPeriodPreset, filter: AppliedDateFilter) {
  if (filter.mode !== 'range' || !filter.fromDate || !filter.toDate) {
    return false;
  }
  const quick = resolveDateFilterParams(quickPresetToDateFilter(preset));
  return quick.fromDate === filter.fromDate && quick.toDate === filter.toDate;
}
