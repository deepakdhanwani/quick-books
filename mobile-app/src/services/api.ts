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

export type OpeningBalanceNature = 'TO_RECEIVE' | 'TO_PAY';

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
  openingBalance?: number;
  openingBalanceNature?: OpeningBalanceNature;
  totalPendingAmount?: number;
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
  openingBalance?: number;
  openingBalanceNature?: OpeningBalanceNature;
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
  openingBalance?: number;
  openingBalanceNature?: OpeningBalanceNature;
  totalPendingAmount?: number;
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
  openingBalance?: number;
  openingBalanceNature?: OpeningBalanceNature;
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

export type SubscriberUserType = 'OWNER' | 'STAFF';

export type SubscriberAuthResponse = {
  token: string;
  role: string;
  userId: number;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  requiresSubscription: boolean;
  userName?: string;
  userType?: SubscriberUserType;
  canChangePin?: boolean;
  staffUserId?: number;
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
export type PaymentListFilter = 'ALL' | 'PENDING' | 'PAID';
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

export type PaymentSettlementType = 'FULL' | 'PARTIAL' | 'SETTLEMENT';

export type SalePayment = {
  id: number;
  amount: number;
  date: string;
  paymentMode?: PaymentMode;
  paymentDetails?: string;
  notes?: string;
  hasProof: boolean;
  proofFileName?: string;
  adjustedAmount?: number;
  settlementType?: PaymentSettlementType;
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
  adjustedAmount?: number;
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
  settlementType?: PaymentSettlementType;
  date?: string;
  paymentDetails?: string;
  notes?: string;
};

export type PaymentProofFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export type ThemeMode = 'DARK' | 'LIGHT';
export type FontSizeMode = 'LARGE' | 'SMALL' | 'EXTRA_SMALL';

export type UserPreferences = {
  theme: ThemeMode;
  fontSize: FontSizeMode;
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
  loggedInUserName?: string;
  userType?: SubscriberUserType;
  canChangePin?: boolean;
  owner?: boolean;
  theme?: ThemeMode;
  fontSize?: FontSizeMode;
};

export type TeamUser = {
  id: number;
  name: string;
  loginPin: string;
  active: boolean;
  createdAt: string;
};

export type TeamUserPayload = {
  name: string;
  loginPin: string;
};

export type UpdateTeamUserPayload = {
  name: string;
  active?: boolean;
};

export type AuditLogEntry = {
  id: number;
  actorType: SubscriberUserType;
  actorName: string;
  actorPin: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId?: number;
  details?: string;
  createdAt: string;
};

export type UpdateAccountSettingsPayload = {
  defaultTaxPercent?: number | null;
  gstNumber?: string | null;
};

export type NextInvoiceNumberResponse = {
  invoiceNumber: string;
  autoGenerated: boolean;
};

export type NextBillNumberResponse = {
  billNumber: string;
  autoGenerated: boolean;
};

export type PurchaseItem = {
  id: number;
  productId?: number;
  productName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  amount: number;
};

export type PurchaseLineItemPayload = {
  productId: number;
  quantity: number;
};

export type PurchasePayment = {
  id: number;
  amount: number;
  date: string;
  paymentMode?: PaymentMode;
  paymentDetails?: string;
  notes?: string;
  hasProof: boolean;
  proofFileName?: string;
  adjustedAmount?: number;
  settlementType?: PaymentSettlementType;
  createdAt: string;
};

export type Purchase = {
  id: number;
  vendorId: number;
  vendorName: string;
  billNumber?: string;
  date: string;
  grossAmount?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netAmount: number;
  paidAmount: number;
  pendingAmount: number;
  adjustedAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  payments?: PurchasePayment[];
  items?: PurchaseItem[];
};

export type PurchasePayload = {
  vendorId: number;
  billNumber?: string;
  date?: string;
  grossAmount?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  notes?: string;
  items?: PurchaseLineItemPayload[];
};

export type MakePaymentPayload = {
  amount: number;
  paymentMode: PaymentMode;
  settlementType?: PaymentSettlementType;
  date?: string;
  paymentDetails?: string;
  notes?: string;
};

export type PaymentReminderStatus = 'PENDING' | 'SNOOZED' | 'COMPLETED' | 'CANCELLED';

export type PaymentReminderTimeFilter = 'active' | 'past' | 'all';

export type PaymentReminder = {
  id: number;
  customerId: number;
  customerName: string;
  saleId?: number;
  invoiceNumber?: string;
  amount?: number;
  promisedDate: string;
  notes?: string;
  status: PaymentReminderStatus;
  snoozedUntil?: string;
  effectiveDueDate: string;
  overdue: boolean;
  dueToday: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentReminderPayload = {
  customerId: number;
  saleId?: number;
  amount?: number;
  promisedDate: string;
  notes?: string;
};

export type SnoozePaymentReminderPayload = {
  snoozedUntil: string;
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
  getUserPreferences: (token: string) =>
    request<UserPreferences>('/api/subscriber/account/preferences', { token }),
  updateUserPreferences: (token: string, payload: UserPreferences) =>
    request<UserPreferences>('/api/subscriber/account/preferences', {
      method: 'PUT',
      token,
      body: payload,
    }),
  updateAccountSettings: (token: string, payload: UpdateAccountSettingsPayload) =>
    request<SubscriberAccountProfile>('/api/subscriber/account/settings', {
      method: 'PUT',
      token,
      body: payload,
    }),
  listTeamUsers: (token: string) =>
    request<TeamUser[]>('/api/subscriber/users', { token }),
  createTeamUser: (token: string, payload: TeamUserPayload) =>
    request<TeamUser>('/api/subscriber/users', { method: 'POST', token, body: payload }),
  getTeamUser: (token: string, id: number) =>
    request<TeamUser>(`/api/subscriber/users/${id}`, { token }),
  updateTeamUser: (token: string, id: number, payload: UpdateTeamUserPayload) =>
    request<TeamUser>(`/api/subscriber/users/${id}`, { method: 'PUT', token, body: payload }),
  setTeamUserPin: (token: string, id: number, loginPin: string) =>
    request<TeamUser>(`/api/subscriber/users/${id}/set-pin`, {
      method: 'POST',
      token,
      body: { loginPin },
    }),
  resetTeamUserPin: (token: string, id: number) =>
    request<TeamUser>(`/api/subscriber/users/${id}/reset-pin`, { method: 'POST', token }),
  deleteTeamUser: (token: string, id: number) =>
    request<void>(`/api/subscriber/users/${id}`, { method: 'DELETE', token }),
  listAuditLogs: (token: string, page = 0, size = 20) =>
    request<PageResponse<AuditLogEntry>>(
      `/api/subscriber/audit-logs?page=${page}&size=${size}`,
      { token },
    ),
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
  listCustomerSales: (
    token: string,
    customerId: number,
    page = 0,
    size = 20,
    paymentFilter: PaymentListFilter = 'ALL',
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (paymentFilter !== 'ALL') {
      params.set('paymentFilter', paymentFilter);
    }
    return request<PageResponse<Sale>>(`/api/subscriber/customers/${customerId}/sales?${params}`, {
      token,
    });
  },
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
  getCustomerAccountSummary: (token: string, customerId: number) =>
    request<PartyAccountSummary>(`/api/subscriber/customers/${customerId}/account-summary`, { token }),
  getCustomerLedger: (
    token: string,
    customerId: number,
    page = 0,
    size = 20,
    fromDate?: string,
    toDate?: string,
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (fromDate) {
      params.set('fromDate', fromDate);
    }
    if (toDate) {
      params.set('toDate', toDate);
    }
    return request<PartyLedgerPageResponse>(
      `/api/subscriber/customers/${customerId}/ledger?${params}`,
      { token },
    );
  },
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
  listVendorPurchases: (
    token: string,
    vendorId: number,
    page = 0,
    size = 20,
    paymentFilter: PaymentListFilter = 'ALL',
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (paymentFilter !== 'ALL') {
      params.set('paymentFilter', paymentFilter);
    }
    return request<PageResponse<Purchase>>(
      `/api/subscriber/vendors/${vendorId}/purchases?${params}`,
      { token },
    );
  },
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
  getVendorAccountSummary: (token: string, vendorId: number) =>
    request<PartyAccountSummary>(`/api/subscriber/vendors/${vendorId}/account-summary`, { token }),
  getVendorLedger: (
    token: string,
    vendorId: number,
    page = 0,
    size = 20,
    fromDate?: string,
    toDate?: string,
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (fromDate) {
      params.set('fromDate', fromDate);
    }
    if (toDate) {
      params.set('toDate', toDate);
    }
    return request<PartyLedgerPageResponse>(
      `/api/subscriber/vendors/${vendorId}/ledger?${params}`,
      { token },
    );
  },
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
  listSales: (
    token: string,
    page = 0,
    size = 20,
    search?: string,
    paymentFilter: PaymentListFilter = 'ALL',
    fromDate?: string,
    toDate?: string,
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    if (paymentFilter !== 'ALL') {
      params.set('paymentFilter', paymentFilter);
    }
    if (fromDate) {
      params.set('fromDate', fromDate);
    }
    if (toDate) {
      params.set('toDate', toDate);
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
    proof?: PaymentProofFile | null,
  ) => {
    const baseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('amount', String(payload.amount));
    formData.append('paymentMode', payload.paymentMode);
    if (payload.settlementType) {
      formData.append('settlementType', payload.settlementType);
    }
    if (payload.date) {
      formData.append('date', payload.date);
    }
    if (payload.paymentDetails?.trim()) {
      formData.append('paymentDetails', payload.paymentDetails.trim());
    }
    if (payload.notes?.trim()) {
      formData.append('notes', payload.notes.trim());
    }
    if (proof) {
      formData.append('proof', {
        uri: proof.uri,
        name: proof.name,
        type: proof.mimeType,
      } as unknown as Blob);
    }

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
  listPurchases: (
    token: string,
    page = 0,
    size = 20,
    search?: string,
    paymentFilter: PaymentListFilter = 'ALL',
    fromDate?: string,
    toDate?: string,
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    if (paymentFilter !== 'ALL') {
      params.set('paymentFilter', paymentFilter);
    }
    if (fromDate) {
      params.set('fromDate', fromDate);
    }
    if (toDate) {
      params.set('toDate', toDate);
    }
    return request<PageResponse<Purchase>>(`/api/subscriber/purchases?${params}`, { token });
  },
  getPurchase: (token: string, id: number) =>
    request<Purchase>(`/api/subscriber/purchases/${id}`, { token }),
  getNextBillNumber: (token: string) =>
    request<NextBillNumberResponse>('/api/subscriber/purchases/next-bill-number', { token }),
  createPurchase: (token: string, payload: PurchasePayload) =>
    request<Purchase>('/api/subscriber/purchases', { method: 'POST', token, body: payload }),
  updatePurchase: (token: string, id: number, payload: PurchasePayload) =>
    request<Purchase>(`/api/subscriber/purchases/${id}`, { method: 'PUT', token, body: payload }),
  makePurchasePayment: async (
    token: string,
    purchaseId: number,
    payload: MakePaymentPayload,
    proof?: PaymentProofFile | null,
  ) => {
    const baseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('amount', String(payload.amount));
    formData.append('paymentMode', payload.paymentMode);
    if (payload.settlementType) {
      formData.append('settlementType', payload.settlementType);
    }
    if (payload.date) {
      formData.append('date', payload.date);
    }
    if (payload.paymentDetails?.trim()) {
      formData.append('paymentDetails', payload.paymentDetails.trim());
    }
    if (payload.notes?.trim()) {
      formData.append('notes', payload.notes.trim());
    }
    if (proof) {
      formData.append('proof', {
        uri: proof.uri,
        name: proof.name,
        type: proof.mimeType,
      } as unknown as Blob);
    }

    const response = await fetch(`${baseUrl}/api/subscriber/purchases/${purchaseId}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail ?? error.message ?? 'Request failed');
    }

    return response.json() as Promise<Purchase>;
  },
  getPurchasePaymentProofUrl: (paymentId: number) =>
    `${getApiBaseUrl()}/api/subscriber/purchases/payments/${paymentId}/proof`,

  getDashboard: (token: string) =>
    request<SubscriberDashboard>('/api/subscriber/reports/dashboard', { token }),

  listPaymentReminders: (
    token: string,
    page = 0,
    size = 20,
    timeFilter: PaymentReminderTimeFilter = 'active',
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      timeFilter,
    });
    return request<PageResponse<PaymentReminder>>(
      `/api/subscriber/payment-reminders?${params}`,
      { token },
    );
  },

  getDuePaymentReminders: (token: string) =>
    request<PaymentReminder[]>('/api/subscriber/payment-reminders/due', { token }),

  getPaymentReminder: (token: string, id: number) =>
    request<PaymentReminder>(`/api/subscriber/payment-reminders/${id}`, { token }),

  createPaymentReminder: (token: string, payload: PaymentReminderPayload) =>
    request<PaymentReminder>('/api/subscriber/payment-reminders', {
      method: 'POST',
      token,
      body: payload,
    }),

  updatePaymentReminder: (token: string, id: number, payload: PaymentReminderPayload) =>
    request<PaymentReminder>(`/api/subscriber/payment-reminders/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),

  snoozePaymentReminder: (token: string, id: number, payload: SnoozePaymentReminderPayload) =>
    request<PaymentReminder>(`/api/subscriber/payment-reminders/${id}/snooze`, {
      method: 'PATCH',
      token,
      body: payload,
    }),

  completePaymentReminder: (token: string, id: number) =>
    request<PaymentReminder>(`/api/subscriber/payment-reminders/${id}/complete`, {
      method: 'PATCH',
      token,
    }),

  deletePaymentReminder: (token: string, id: number) =>
    request<void>(`/api/subscriber/payment-reminders/${id}`, { method: 'DELETE', token }),

  getBusinessSummaryReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(
      `/api/subscriber/reports/business-summary${buildReportQuery(from, to)}`,
      { token },
    ),

  getSalesReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(`/api/subscriber/reports/sales${buildReportQuery(from, to)}`, { token }),

  getPurchasesReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(
      `/api/subscriber/reports/purchases${buildReportQuery(from, to)}`,
      { token },
    ),

  getReceivablesReport: (token: string) =>
    request<BusinessReport>('/api/subscriber/reports/receivables', { token }),

  getPayablesReport: (token: string) =>
    request<BusinessReport>('/api/subscriber/reports/payables', { token }),

  getProductPerformanceReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(
      `/api/subscriber/reports/products${buildReportQuery(from, to)}`,
      { token },
    ),

  getIntelligence: (token: string) =>
    request<BusinessIntelligence>('/api/subscriber/reports/intelligence', { token }),

  getCustomerTrendsReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(
      `/api/subscriber/reports/customer-trends${buildReportQuery(from, to)}`,
      { token },
    ),

  getVendorTrendsReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(
      `/api/subscriber/reports/vendor-trends${buildReportQuery(from, to)}`,
      { token },
    ),

  getOrdersReport: (token: string, from?: string, to?: string) =>
    request<BusinessReport>(`/api/subscriber/reports/orders${buildReportQuery(from, to)}`, { token }),
};

function buildReportQuery(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) {
    params.set('from', from);
  }
  if (to) {
    params.set('to', to);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export type PartyLedgerEntry = {
  id: string;
  date: string;
  kind: 'INVOICE' | 'PAYMENT_IN' | 'BILL' | 'PAYMENT_OUT' | string;
  referenceId: number;
  referenceLabel: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
};

export type PartyAccountSummary = {
  totalDebit: number;
  totalCredit: number;
  totalAdjusted: number;
  closingBalance: number;
  openingDebit: number;
  openingCredit: number;
  openingBalance: number;
  entryCount: number;
};

export type PartyLedgerPageResponse = {
  summary: PartyAccountSummary;
  content: PartyLedgerEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ChartPoint = {
  label: string;
  value: number;
  projected?: boolean;
};

export type ForecastMetric = {
  key: string;
  label: string;
  currentValue: number;
  projectedValue: number;
  previousValue: number;
  changePercent: number;
  period: string;
};

export type BusinessInsight = {
  type: 'FORECAST' | 'RISK' | 'ACTION' | 'OPPORTUNITY' | string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  title: string;
  message: string;
  metric?: string;
};

export type CashFlowOutlook = {
  expectedInflow: number;
  expectedOutflow: number;
  netOutlook: number;
  receivables: number;
  payables: number;
  summary: string;
};

export type BusinessIntelligence = {
  healthScore: number;
  healthLabel: string;
  healthSummary: string;
  forecasts: ForecastMetric[];
  cashFlowOutlook: CashFlowOutlook;
  insights: BusinessInsight[];
  salesTrend: ChartPoint[];
  purchaseTrend: ChartPoint[];
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

export type BusinessReport = {
  reportType: string;
  title: string;
  generatedAt: string;
  filters: Record<string, string>;
  summary: ReportSummaryItem[];
  columns: ReportColumn[];
  rows: Record<string, string>[];
  chartData: ChartPoint[];
};

export type SubscriberDashboard = {
  todaySales: number;
  todayPurchases: number;
  monthSales: number;
  monthPurchases: number;
  pendingReceivables: number;
  pendingPayables: number;
  monthNetPosition: number;
  customerCount: number;
  vendorCount: number;
  productCount: number;
  saleCount: number;
  purchaseCount: number;
};
