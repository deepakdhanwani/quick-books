export type PlanDuration = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';

export const PLAN_DURATION_OPTIONS: { label: string; value: PlanDuration }[] = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Half Yearly', value: 'HALF_YEARLY' },
  { label: 'Annual', value: 'ANNUAL' },
];

export function formatPlanDuration(duration: PlanDuration | string): string {
  if (duration === 'MONTHLY') return 'Monthly';
  if (duration === 'QUARTERLY') return 'Quarterly';
  if (duration === 'HALF_YEARLY') return 'Half Yearly';
  if (duration === 'ANNUAL') return 'Annual';
  return String(duration);
}
