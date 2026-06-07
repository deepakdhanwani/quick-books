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

export type Product = {
  id: number;
  name: string;
  sellingPrice: number;
  discount: number;
  netAmount: number;
  active: boolean;
  createdAt: string;
};

export type ProductPayload = {
  name: string;
  sellingPrice: number;
  discount?: number;
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

export type SubscriptionPlanOption = {
  id: number;
  name: string;
  duration: string;
  price: number;
  description?: string;
  discountAmount: number;
  discountName?: string;
  taxAmount: number;
  totalAmount: number;
};

export type SubscribeResponse = {
  subscription: SubscriberSubscriptionInfo;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  requiresSubscription: boolean;
};

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER';

export type SaleItem = {
  id: number;
  productId?: number;
  productName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  amount: number;
};

export type SaleLineItemPayload = {
  productId: number;
  quantity: number;
};

export type SalePayment = {
  id: number;
  amount: number;
  date: string;
  paymentMode?: PaymentMode;
  paymentDetails?: string;
  notes?: string;
  hasProof: boolean;
  proofFileName?: string;
  createdAt: string;
};

export type Sale = {
  id: number;
  customerId: number;
  customerName: string;
  invoiceNumber?: string;
  invoiceDetails?: string;
  date: string;
  grossAmount?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  payments?: SalePayment[];
  items?: SaleItem[];
};

export type SalePayload = {
  customerId: number;
  invoiceNumber?: string;
  invoiceDetails?: string;
  date?: string;
  grossAmount?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  notes?: string;
  items?: SaleLineItemPayload[];
};

export type ReceivePaymentPayload = {
  amount: number;
  paymentMode: PaymentMode;
  date?: string;
  paymentDetails?: string;
  notes?: string;
};

export type PaymentProofFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export type SubscriberAccountProfile = {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  businessTypeName?: string;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  active: boolean;
  defaultTaxPercent?: number;
  gstNumber?: string;
  createdAt: string;
  currentSubscription?: SubscriberSubscriptionInfo;
};

export type UpdateAccountSettingsPayload = {
  defaultTaxPercent?: number | null;
  gstNumber?: string | null;
};

export type NextInvoiceNumberResponse = {
  invoiceNumber: string;
  autoGenerated: boolean;
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
  updateAccountSettings: (token: string, payload: UpdateAccountSettingsPayload) =>
    request<SubscriberAccountProfile>('/api/subscriber/account/settings', {
      method: 'PUT',
      token,
      body: payload,
    }),
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
  listProducts: (
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
    return request<PageResponse<Product>>(`/api/subscriber/products?${params}`, { token });
  },
  getProduct: (token: string, id: number) =>
    request<Product>(`/api/subscriber/products/${id}`, { token }),
  createProduct: (token: string, payload: ProductPayload) =>
    request<Product>('/api/subscriber/products', { method: 'POST', token, body: payload }),
  updateProduct: (token: string, id: number, payload: ProductPayload) =>
    request<Product>(`/api/subscriber/products/${id}`, { method: 'PUT', token, body: payload }),
  setProductActive: (token: string, id: number, active: boolean) =>
    request<Product>(`/api/subscriber/products/${id}/active`, {
      method: 'PATCH',
      token,
      body: { active },
    }),
  deleteProduct: (token: string, id: number) =>
    request<void>(`/api/subscriber/products/${id}`, { method: 'DELETE', token }),
  listSubscriptionPlans: (token: string) =>
    request<SubscriptionPlanOption[]>('/api/subscriber/subscription-plans', { token }),
  getCurrentSubscription: (token: string) =>
    request<SubscriberSubscriptionInfo | null>('/api/subscriber/subscriptions/current', { token }),
  subscribeToPlan: (token: string, planId: number) =>
    request<SubscribeResponse>('/api/subscriber/subscriptions', {
      method: 'POST',
      token,
      body: { planId },
    }),
  listSales: (token: string, page = 0, size = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    return request<PageResponse<Sale>>(`/api/subscriber/sales?${params}`, { token });
  },
  getSale: (token: string, id: number) =>
    request<Sale>(`/api/subscriber/sales/${id}`, { token }),
  getNextInvoiceNumber: (token: string) =>
    request<NextInvoiceNumberResponse>('/api/subscriber/sales/next-invoice-number', { token }),
  createSale: (token: string, payload: SalePayload) =>
    request<Sale>('/api/subscriber/sales', { method: 'POST', token, body: payload }),
  updateSale: (token: string, id: number, payload: SalePayload) =>
    request<Sale>(`/api/subscriber/sales/${id}`, { method: 'PUT', token, body: payload }),
  receiveSalePayment: async (
    token: string,
    saleId: number,
    payload: ReceivePaymentPayload,
    proof: PaymentProofFile,
  ) => {
    const baseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('amount', String(payload.amount));
    formData.append('paymentMode', payload.paymentMode);
    if (payload.date) {
      formData.append('date', payload.date);
    }
    if (payload.paymentDetails?.trim()) {
      formData.append('paymentDetails', payload.paymentDetails.trim());
    }
    if (payload.notes?.trim()) {
      formData.append('notes', payload.notes.trim());
    }
    formData.append('proof', {
      uri: proof.uri,
      name: proof.name,
      type: proof.mimeType,
    } as unknown as Blob);

    const response = await fetch(`${baseUrl}/api/subscriber/sales/${saleId}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail ?? error.message ?? 'Request failed');
    }

    return response.json() as Promise<Sale>;
  },
  getPaymentProofUrl: (saleId: number, paymentId: number) =>
    `${getApiBaseUrl()}/api/subscriber/sales/payments/${paymentId}/proof`,
};
