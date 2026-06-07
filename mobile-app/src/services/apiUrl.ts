export const BACKEND_PORT = 9090;

export const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:9090';

export function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function buildApiBaseUrl(host: string, port = BACKEND_PORT): string {
  return `http://${host}:${port}`;
}
