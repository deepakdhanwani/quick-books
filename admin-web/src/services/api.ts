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

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

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
};
