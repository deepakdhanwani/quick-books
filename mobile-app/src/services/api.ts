const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

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

  return response.json();
}

export type SubscriberAuthResponse = {
  token: string;
  role: string;
  userId: number;
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  requiresSubscription: boolean;
};

export const api = {
  subscriberLogin: (phone: string, loginPin: string) =>
    request<SubscriberAuthResponse>('/api/auth/subscriber/login', {
      method: 'POST',
      body: { phone, loginPin },
    }),
};
