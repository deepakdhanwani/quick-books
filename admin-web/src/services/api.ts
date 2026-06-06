const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:9090';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export type AuthResponse = {
  token: string;
  role: string;
  userId: number;
};

export type BusinessType = {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
};

export type Subscriber = {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  businessTypeId?: number;
  businessTypeName?: string;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  active: boolean;
  createdAt: string;
  loginPin?: string;
};

export type SubscriberSubscriptionInfo = {
  id: number;
  planName: string;
  planDuration: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  planPrice: number;
  startDate: string;
  endDate: string;
  taxAmount: number;
  totalAmount: number;
  discountName?: string;
  recordStatus: 'ACTIVE' | 'EXPIRED';
};

export type SubscriberDetail = Subscriber & {
  currentSubscription?: SubscriberSubscriptionInfo | null;
  subscriptionHistory: SubscriberSubscriptionInfo[];
};

export type CreateSubscriberPayload = {
  businessName: string;
  ownerName: string;
  phone: string;
  businessTypeId: number;
};

export type UpdateSubscriberPayload = {
  businessName: string;
  ownerName: string;
  phone: string;
  businessTypeId: number;
  active: boolean;
};

export type CreateBusinessTypePayload = {
  name: string;
  description?: string;
};

export type UpdateBusinessTypePayload = {
  name: string;
  description?: string;
  active?: boolean;
};

export type SeedBusinessTypesResult = {
  created: number;
  skipped: number;
  totalKnown: number;
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  duration: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  price: number;
  description?: string;
  active: boolean;
  createdAt: string;
};

export type CreateSubscriptionPlanPayload = {
  name: string;
  duration: SubscriptionPlan['duration'];
  price: number;
  description?: string;
};

export type UpdateSubscriptionPlanPayload = {
  name: string;
  duration: SubscriptionPlan['duration'];
  price: number;
  description?: string;
  active?: boolean;
};

export type Tax = {
  id: number;
  name: string;
  rate: number;
  active: boolean;
  createdAt: string;
  applicablePlanIds: number[];
  applicablePlanNames: string[];
};

export type CreateTaxPayload = {
  name: string;
  rate: number;
  planIds: number[];
};

export type UpdateTaxPayload = {
  name: string;
  rate: number;
  planIds: number[];
  active?: boolean;
};

export type Discount = {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  scope: 'ALL' | 'SPECIFIC';
  validFrom?: string | null;
  validTo?: string | null;
  active: boolean;
  createdAt: string;
  planIds: number[];
  planNames: string[];
  subscriberIds: number[];
  subscriberNames: string[];
};

export type CreateDiscountPayload = {
  name: string;
  type: Discount['type'];
  value: number;
  scope: Discount['scope'];
  validFrom?: string;
  validTo?: string;
  planIds: number[];
  subscriberIds?: number[];
};

export type UpdateDiscountPayload = CreateDiscountPayload & {
  active?: boolean;
};

export type SubscriberOption = {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type ReportSummaryItem = {
  label: string;
  value: string;
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
};

export type AdminReport = {
  reportType: string;
  title: string;
  generatedAt: string;
  filters: Record<string, string>;
  summary: ReportSummaryItem[];
  columns: ReportColumn[];
  rows: Record<string, string>[];
  chartData: ChartPoint[];
};

export type AdminDashboardSummary = {
  totalSubscribers: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiringSoon: number;
  revenueMtd: number;
};

type ReportQuery = Record<string, string | number | undefined>;

function buildQuery(params: ReportQuery) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const api = {
  adminLogin: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    }),
  health: () => request<{ status: string }>('/api/health'),
  getSubscribers: (token: string, page = 0, size = 10) =>
    request<PageResponse<Subscriber>>(`/api/admin/subscribers?page=${page}&size=${size}`, { token }),
  getSubscriber: (token: string, id: number) =>
    request<SubscriberDetail>(`/api/admin/subscribers/${id}`, { token }),
  createSubscriber: (token: string, payload: CreateSubscriberPayload) =>
    request<Subscriber>('/api/admin/subscribers', {
      method: 'POST',
      token,
      body: payload,
    }),
  updateSubscriber: (token: string, id: number, payload: UpdateSubscriberPayload) =>
    request<Subscriber>(`/api/admin/subscribers/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  resetSubscriberPin: (token: string, id: number) =>
    request<Subscriber>(`/api/admin/subscribers/${id}/reset-pin`, {
      method: 'POST',
      token,
    }),
  getBusinessTypes: (token: string, page = 0, size = 10) =>
    request<PageResponse<BusinessType>>(`/api/admin/business-types?page=${page}&size=${size}`, { token }),
  getActiveBusinessTypes: (token: string) =>
    request<BusinessType[]>('/api/admin/business-types/active', { token }),
  createBusinessType: (token: string, payload: CreateBusinessTypePayload) =>
    request<BusinessType>('/api/admin/business-types', {
      method: 'POST',
      token,
      body: payload,
    }),
  seedBusinessTypes: (token: string) =>
    request<SeedBusinessTypesResult>('/api/admin/business-types/seed-defaults', {
      method: 'POST',
      token,
    }),
  updateBusinessType: (token: string, id: number, payload: UpdateBusinessTypePayload) =>
    request<BusinessType>(`/api/admin/business-types/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  deleteBusinessType: (token: string, id: number) =>
    request<void>(`/api/admin/business-types/${id}`, {
      method: 'DELETE',
      token,
    }),
  getSubscriptionPlans: (token: string, page = 0, size = 10) =>
    request<PageResponse<SubscriptionPlan>>(`/api/admin/subscription-plans?page=${page}&size=${size}`, { token }),
  getActiveSubscriptionPlans: (token: string) =>
    request<SubscriptionPlan[]>('/api/admin/subscription-plans/active', { token }),
  createSubscriptionPlan: (token: string, payload: CreateSubscriptionPlanPayload) =>
    request<SubscriptionPlan>('/api/admin/subscription-plans', {
      method: 'POST',
      token,
      body: payload,
    }),
  updateSubscriptionPlan: (token: string, id: number, payload: UpdateSubscriptionPlanPayload) =>
    request<SubscriptionPlan>(`/api/admin/subscription-plans/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  deleteSubscriptionPlan: (token: string, id: number) =>
    request<void>(`/api/admin/subscription-plans/${id}`, {
      method: 'DELETE',
      token,
    }),
  getTaxes: (token: string, page = 0, size = 10) =>
    request<PageResponse<Tax>>(`/api/admin/taxes?page=${page}&size=${size}`, { token }),
  createTax: (token: string, payload: CreateTaxPayload) =>
    request<Tax>('/api/admin/taxes', {
      method: 'POST',
      token,
      body: payload,
    }),
  updateTax: (token: string, id: number, payload: UpdateTaxPayload) =>
    request<Tax>(`/api/admin/taxes/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  deleteTax: (token: string, id: number) =>
    request<void>(`/api/admin/taxes/${id}`, {
      method: 'DELETE',
      token,
    }),
  getSelectableSubscribers: (token: string) =>
    request<SubscriberOption[]>('/api/admin/subscribers/selectable', { token }),
  getDiscounts: (token: string, page = 0, size = 10) =>
    request<PageResponse<Discount>>(`/api/admin/discounts?page=${page}&size=${size}`, { token }),
  createDiscount: (token: string, payload: CreateDiscountPayload) =>
    request<Discount>('/api/admin/discounts', {
      method: 'POST',
      token,
      body: payload,
    }),
  updateDiscount: (token: string, id: number, payload: UpdateDiscountPayload) =>
    request<Discount>(`/api/admin/discounts/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  deleteDiscount: (token: string, id: number) =>
    request<void>(`/api/admin/discounts/${id}`, {
      method: 'DELETE',
      token,
    }),
  getDashboardSummary: (token: string) =>
    request<AdminDashboardSummary>('/api/admin/reports/summary', { token }),
  getRevenueReport: (
    token: string,
    params: { from?: string; to?: string; planId?: number; businessTypeId?: number } = {},
  ) => request<AdminReport>(`/api/admin/reports/revenue${buildQuery(params)}`, { token }),
  getPendingSubscriptionsReport: (token: string) =>
    request<AdminReport>('/api/admin/reports/pending-subscriptions', { token }),
  getExpiringSubscriptionsReport: (token: string, withinDays = 30) =>
    request<AdminReport>(`/api/admin/reports/expiring-subscriptions${buildQuery({ withinDays })}`, { token }),
  getBusinessTypeBreakdownReport: (
    token: string,
    params: { from?: string; to?: string } = {},
  ) => request<AdminReport>(`/api/admin/reports/business-type-breakdown${buildQuery(params)}`, { token }),
};
