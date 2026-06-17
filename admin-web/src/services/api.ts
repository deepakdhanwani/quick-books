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
  defaultCompanyId?: number | null;
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
  minCompanies: number;
  maxCompanies: number;
  description?: string;
  active: boolean;
  createdAt: string;
};

export type CreateSubscriptionPlanPayload = {
  name: string;
  duration: SubscriptionPlan['duration'];
  price: number;
  minCompanies: number;
  maxCompanies: number;
  description?: string;
};

export type UpdateSubscriptionPlanPayload = {
  name: string;
  duration: SubscriptionPlan['duration'];
  price: number;
  minCompanies: number;
  maxCompanies: number;
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

export type SystemHealth = {
  status: 'UP' | 'DOWN';
  service: string;
  database: { status: 'UP' | 'DOWN'; responseTimeMs: number };
  jvm: { heapUsedMb: number; heapMaxMb: number; uptimeSeconds: number };
  monitoring: { storedLogs: number; retentionDays: number };
  recentTraffic: RequestLogSummary;
};

export type RequestLogSummary = {
  windowStart: string;
  windowEnd: string;
  windowMinutes: number;
  totalRequests: number;
  errorCount: number;
  slowCount: number;
  avgDurationMs: number;
  maxDurationMs: number;
  slowestEndpoints: SlowEndpointStat[];
};

export type SlowEndpointStat = {
  method: string;
  path: string;
  requestCount: number;
  avgDurationMs: number;
  maxDurationMs: number;
};

export type RequestLogEntry = {
  id: number;
  createdAt: string;
  method: string;
  path: string;
  queryString?: string;
  statusCode: number;
  durationMs: number;
  clientIp?: string;
  userRole?: string;
  subscriberId?: number;
  subscriberName?: string;
  companyId?: number;
  companyName?: string;
  actorName?: string;
  actorType?: string;
};

type ReportQuery = Record<string, string | number | boolean | undefined>;

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
  health: () => request<{ status: string; service?: string }>('/api/health'),
  getSystemHealth: (token: string) =>
    request<SystemHealth>('/api/admin/monitor/health', { token }),
  getRequestLogSummary: (token: string, windowMinutes = 60) =>
    request<RequestLogSummary>(`/api/admin/monitor/request-logs/summary${buildQuery({ windowMinutes })}`, { token }),
  getRequestLogs: (
    token: string,
    params: {
      page?: number;
      size?: number;
      subscriberId?: number;
      companyId?: number;
      userRole?: string;
      errorsOnly?: boolean;
      slowOnly?: boolean;
      path?: string;
    } = {},
  ) =>
    request<PageResponse<RequestLogEntry>>(
      `/api/admin/monitor/request-logs${buildQuery({
        page: params.page ?? 0,
        size: params.size ?? 25,
        subscriberId: params.subscriberId,
        companyId: params.companyId,
        userRole: params.userRole,
        errorsOnly: params.errorsOnly,
        slowOnly: params.slowOnly,
        path: params.path,
      })}`,
      { token },
    ),
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
  getSubscriberCompanies: (token: string, subscriberId: number) =>
    request<AdminCompanySummary[]>(`/api/admin/subscribers/${subscriberId}/companies`, { token }),
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
  getDataStatus: (token: string) =>
    request<DataStatus>('/api/admin/settings/data-status', { token }),
  truncateTransactionalData: (token: string, confirmPhrase: string) =>
    request<TruncateResult>('/api/admin/settings/truncate-transactional', {
      method: 'POST',
      token,
      body: { confirmPhrase },
    }),
  createDatabaseBackup: (token: string) =>
    request<BackupInfo>('/api/admin/settings/backup', {
      method: 'POST',
      token,
    }),
  listDatabaseBackups: (token: string) =>
    request<BackupInfo[]>('/api/admin/settings/backups', { token }),
  downloadDatabaseBackup: async (token: string, fileName: string) => {
    const response = await fetch(
      `${API_URL}/api/admin/settings/backups/${encodeURIComponent(fileName)}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Download failed' }));
      throw new Error(error.detail ?? 'Download failed');
    }

    return response.blob();
  },
  restoreDatabaseBackup: async (token: string, file: File, confirmPhrase: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confirmPhrase', confirmPhrase);

    const response = await fetch(`${API_URL}/api/admin/settings/restore`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Restore failed' }));
      throw new Error(error.detail ?? 'Restore failed');
    }

    return response.json() as Promise<RestoreResult>;
  },
  startDemoDataGeneration: (
    token: string,
    payload: {
      businessTypeId: number;
      fromDate: string;
      toDate: string;
      companyId?: number;
      companyName?: string;
    },
  ) =>
    request<DemoDataJob>('/api/admin/settings/generate-demo-data', {
      method: 'POST',
      token,
      body: payload,
    }),
  getDemoDataJob: (token: string, jobId: string) =>
    request<DemoDataJob>(`/api/admin/settings/demo-data-jobs/${jobId}`, { token }),
  listDemoSubscribers: (token: string) =>
    request<DemoSubscriber[]>('/api/admin/settings/demo-subscribers', { token }),

  getSubscriberDataSummary: (token: string, subscriberId: number, companyId?: number) =>
    request<SubscriberDataSummary>(
      `/api/admin/subscribers/${subscriberId}/data/summary${buildQuery({ companyId })}`,
      { token },
    ),

  getSubscriberCustomers: (
    token: string,
    subscriberId: number,
    params: SubscriberListQuery = {},
  ) =>
    request<PageResponse<SubscriberCustomer>>(
      `/api/admin/subscribers/${subscriberId}/data/customers${buildQuery({
        companyId: params.companyId,
        page: params.page,
        size: params.size,
        active: params.active,
        search: params.search,
      })}`,
      { token },
    ),

  getSubscriberVendors: (token: string, subscriberId: number, params: SubscriberListQuery = {}) =>
    request<PageResponse<SubscriberVendor>>(
      `/api/admin/subscribers/${subscriberId}/data/vendors${buildQuery({
        companyId: params.companyId,
        page: params.page,
        size: params.size,
        active: params.active,
        search: params.search,
      })}`,
      { token },
    ),

  getSubscriberProducts: (token: string, subscriberId: number, params: SubscriberListQuery = {}) =>
    request<PageResponse<SubscriberProduct>>(
      `/api/admin/subscribers/${subscriberId}/data/products${buildQuery({
        companyId: params.companyId,
        page: params.page,
        size: params.size,
        active: params.active,
        search: params.search,
      })}`,
      { token },
    ),

  getSubscriberSales: (
    token: string,
    subscriberId: number,
    params: SubscriberTransactionQuery = {},
  ) =>
    request<PageResponse<SubscriberSale>>(
      `/api/admin/subscribers/${subscriberId}/data/sales${buildQuery({
        companyId: params.companyId,
        page: params.page,
        size: params.size,
        search: params.search,
        paymentFilter: params.paymentFilter,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })}`,
      { token },
    ),

  getSubscriberPurchases: (
    token: string,
    subscriberId: number,
    params: SubscriberTransactionQuery = {},
  ) =>
    request<PageResponse<SubscriberPurchase>>(
      `/api/admin/subscribers/${subscriberId}/data/purchases${buildQuery({
        companyId: params.companyId,
        page: params.page,
        size: params.size,
        search: params.search,
        paymentFilter: params.paymentFilter,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })}`,
      { token },
    ),

  getSubscriberTeamUsers: (token: string, subscriberId: number) =>
    request<SubscriberTeamUser[]>(`/api/admin/subscribers/${subscriberId}/data/users`, { token }),

  getSubscriberAuditLogs: (
    token: string,
    subscriberId: number,
    page = 0,
    size = 20,
  ) =>
    request<PageResponse<SubscriberAuditLog>>(
      `/api/admin/subscribers/${subscriberId}/data/audit-logs?page=${page}&size=${size}`,
      { token },
    ),

  getSubscriberSalesReport: (
    token: string,
    subscriberId: number,
    params: { companyId?: number; from?: string; to?: string } = {},
  ) =>
    request<AdminReport>(
      `/api/admin/subscribers/${subscriberId}/data/reports/sales${buildQuery(params)}`,
      { token },
    ),

  getSubscriberPurchasesReport: (
    token: string,
    subscriberId: number,
    params: { companyId?: number; from?: string; to?: string } = {},
  ) =>
    request<AdminReport>(
      `/api/admin/subscribers/${subscriberId}/data/reports/purchases${buildQuery(params)}`,
      { token },
    ),

  getSubscriberBusinessSummaryReport: (
    token: string,
    subscriberId: number,
    params: { companyId?: number; from?: string; to?: string } = {},
  ) =>
    request<AdminReport>(
      `/api/admin/subscribers/${subscriberId}/data/reports/summary${buildQuery(params)}`,
      { token },
    ),
};

export type TableCount = {
  tableName: string;
  label: string;
  rowCount: number;
};

export type BackupInfo = {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
};

export type DataStatus = {
  transactionalTables: TableCount[];
  backups: BackupInfo[];
  lastBackupAt?: string | null;
};

export type TruncateResult = {
  message: string;
  clearedTables: TableCount[];
};

export type RestoreResult = {
  message: string;
};

export type DemoDataJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type DemoDataGenerationResult = {
  subscriberId: number;
  companyId: number;
  companyName: string;
  companyAlias: string;
  businessName: string;
  businessTypeName: string;
  ownerName: string;
  phone: string;
  loginPin: string;
  customersCreated: number;
  vendorsCreated: number;
  productsCreated: number;
  purchasesCreated: number;
  salesCreated: number;
  companiesSeeded?: number;
  companiesSummary?: string;
  totalCustomers: number;
  totalVendors: number;
  totalProducts: number;
  totalPurchases: number;
  totalSales: number;
};

export type DemoDataJob = {
  jobId: string;
  status: DemoDataJobStatus;
  progressPercent: number;
  currentStep: string;
  message: string;
  result?: DemoDataGenerationResult | null;
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
};

export type DemoCompanySummary = {
  id: number;
  name: string;
  alias: string;
  customerCount: number;
  vendorCount: number;
  productCount: number;
  saleCount: number;
  purchaseCount: number;
};

export type DemoSubscriber = {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  loginPin: string;
  businessTypeId?: number;
  businessTypeName?: string;
  createdAt: string;
  customerCount: number;
  vendorCount: number;
  productCount: number;
  saleCount: number;
  purchaseCount: number;
  companies: DemoCompanySummary[];
};

export type AdminCompanySummary = {
  id: number;
  name: string;
  alias: string;
  businessTypeId?: number;
  businessTypeName?: string;
  defaultCompany: boolean;
  customerCount: number;
  vendorCount: number;
  productCount: number;
  saleCount: number;
  purchaseCount: number;
};

export type PaymentListFilter = 'ALL' | 'PENDING' | 'PAID';

export type SubscriberListQuery = {
  companyId?: number;
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
};

export type SubscriberTransactionQuery = SubscriberListQuery & {
  paymentFilter?: PaymentListFilter;
  fromDate?: string;
  toDate?: string;
};

export type SubscriberDataSummary = {
  customerCount: number;
  vendorCount: number;
  productCount: number;
  saleCount: number;
  purchaseCount: number;
  teamUserCount: number;
  auditLogCount: number;
  totalSalesAmount: number;
  totalPurchasesAmount: number;
  pendingSalesAmount: number;
  pendingPurchasesAmount: number;
};

export type SubscriberCustomer = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  businessName?: string;
  gstNumber?: string;
  active: boolean;
  createdAt: string;
  totalPendingAmount: number;
};

export type SubscriberVendor = {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendorType: 'INDIVIDUAL' | 'BUSINESS';
  businessName?: string;
  gstNumber?: string;
  active: boolean;
  createdAt: string;
  totalPendingAmount: number;
};

export type SubscriberProduct = {
  id: number;
  name: string;
  sellingPrice: number;
  discount: number;
  netAmount: number;
  active: boolean;
  createdAt: string;
};

export type SubscriberSale = {
  id: number;
  customerId: number;
  customerName: string;
  invoiceNumber?: string;
  date: string;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
  createdAt: string;
};

export type SubscriberPurchase = {
  id: number;
  vendorId: number;
  vendorName: string;
  billNumber?: string;
  date: string;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
  createdAt: string;
};

export type SubscriberTeamUser = {
  id: number;
  name: string;
  loginPin: string;
  active: boolean;
  createdAt: string;
};

export type SubscriberAuditLog = {
  id: number;
  actorType: 'OWNER' | 'TEAM_USER' | 'SYSTEM';
  actorName: string;
  actorPin?: string;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  createdAt: string;
};
