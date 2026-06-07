import {
  getApiBaseUrl,
  getAutoDetectedApiBaseUrl,
  initApiBaseUrl,
  normalizeApiBaseUrl,
  refreshApiBaseUrl,
  resetApiBaseUrl,
  saveApiBaseUrl,
  getDefaultApiBaseUrl,
} from './apiConfig';

export {
  getApiBaseUrl,
  getAutoDetectedApiBaseUrl,
  getDefaultApiBaseUrl,
  initApiBaseUrl,
  refreshApiBaseUrl,
  saveApiBaseUrl,
  resetApiBaseUrl,
  normalizeApiBaseUrl,
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function checkApiHealth(baseUrl?: string): Promise<{ ok: boolean; message: string; url: string }> {
  const url = normalizeApiBaseUrl(baseUrl ?? getApiBaseUrl());

  try {
    const response = await fetch(`${url}/api/health`, { method: 'GET' });
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}`, url };
    }
    const data = (await response.json()) as { status?: string };
    return { ok: true, message: data.status ?? 'OK', url };
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network request failed';
    return { ok: false, message: detail, url };
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const url = `${baseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network request failed';
    throw new Error(`Cannot reach backend at ${baseUrl}. ${detail}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail ?? error.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type CustomerType = 'INDIVIDUAL' | 'COMPANY' | 'SHOP' | 'OTHER';

export type Customer = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType?: CustomerType;
  businessName?: string;
  gstNumber?: string;
  businessDetails?: string;
  active: boolean;
  createdAt: string;
};

export type CustomerPayload = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType?: CustomerType;
  businessName?: string;
  gstNumber?: string;
  businessDetails?: string;
  active?: boolean;
};

export type Vendor = {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendorType?: CustomerType;
  businessName?: string;
  gstNumber?: string;
  businessDetails?: string;
  active: boolean;
  createdAt: string;
};

export type VendorPayload = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendorType?: CustomerType;
  businessName?: string;
  gstNumber?: string;
  businessDetails?: string;
  active?: boolean;
};

export type SubscriberAuthResponse = {
  token: string;
  role: string;
  userId: number;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  requiresSubscription: boolean;
};

export type ChangePinPayload = {
  currentPin: string;
  newPin: string;
  confirmNewPin: string;
};

export type SubscriberSubscriptionInfo = {
  id: number;
  planName: string;
  planDuration: string;
  planPrice: number;
  startDate: string;
  endDate: string;
  taxAmount: number;
  totalAmount: number;
  discountName?: string;
  recordStatus: string;
};

export type SubscriberAccountProfile = {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  businessTypeName?: string;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  active: boolean;
  createdAt: string;
  currentSubscription?: SubscriberSubscriptionInfo;
};

export const api = {
  subscriberLogin: (phone: string, loginPin: string) =>
    request<SubscriberAuthResponse>('/api/auth/subscriber/login', {
      method: 'POST',
      body: { phone, loginPin },
    }),
  changePin: (token: string, payload: ChangePinPayload) =>
    request<{ message: string }>('/api/subscriber/account/change-pin', {
      method: 'POST',
      token,
      body: payload,
    }),
  getAccountProfile: (token: string) =>
    request<SubscriberAccountProfile>('/api/subscriber/account/profile', { token }),
  listCustomers: (
    token: string,
    page = 0,
    size = 20,
    active?: boolean,
    search?: string,
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (active !== undefined) {
      params.set('active', String(active));
    }
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    return request<PageResponse<Customer>>(`/api/subscriber/customers?${params}`, { token });
  },
  getCustomer: (token: string, id: number) =>
    request<Customer>(`/api/subscriber/customers/${id}`, { token }),
  createCustomer: (token: string, payload: CustomerPayload) =>
    request<Customer>('/api/subscriber/customers', { method: 'POST', token, body: payload }),
  updateCustomer: (token: string, id: number, payload: CustomerPayload) =>
    request<Customer>(`/api/subscriber/customers/${id}`, { method: 'PUT', token, body: payload }),
  setCustomerActive: (token: string, id: number, active: boolean) =>
    request<Customer>(`/api/subscriber/customers/${id}/active`, {
      method: 'PATCH',
      token,
      body: { active },
    }),
  deleteCustomer: (token: string, id: number) =>
    request<void>(`/api/subscriber/customers/${id}`, { method: 'DELETE', token }),
  listVendors: (
    token: string,
    page = 0,
    size = 20,
    active?: boolean,
    search?: string,
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (active !== undefined) {
      params.set('active', String(active));
    }
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    return request<PageResponse<Vendor>>(`/api/subscriber/vendors?${params}`, { token });
  },
  getVendor: (token: string, id: number) =>
    request<Vendor>(`/api/subscriber/vendors/${id}`, { token }),
  createVendor: (token: string, payload: VendorPayload) =>
    request<Vendor>('/api/subscriber/vendors', { method: 'POST', token, body: payload }),
  updateVendor: (token: string, id: number, payload: VendorPayload) =>
    request<Vendor>(`/api/subscriber/vendors/${id}`, { method: 'PUT', token, body: payload }),
  setVendorActive: (token: string, id: number, active: boolean) =>
    request<Vendor>(`/api/subscriber/vendors/${id}/active`, {
      method: 'PATCH',
      token,
      body: { active },
    }),
  deleteVendor: (token: string, id: number) =>
    request<void>(`/api/subscriber/vendors/${id}`, { method: 'DELETE', token }),
};
