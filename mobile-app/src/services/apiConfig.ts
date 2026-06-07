import * as SecureStore from 'expo-secure-store';
import { discoverWorkingApiBaseUrl, getAutoDetectedApiBaseUrl } from './apiDiscovery';
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl } from './apiUrl';

export { DEFAULT_API_BASE_URL, normalizeApiBaseUrl, getAutoDetectedApiBaseUrl };

const STORAGE_KEY = 'quickbooks_api_base_url';

let runtimeBaseUrl = getAutoDetectedApiBaseUrl();
let initialized = false;

export function getApiBaseUrl(): string {
  return runtimeBaseUrl;
}

export function getDefaultApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

async function persistApiBaseUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, url);
  } catch {
    // URL still applies for this session if secure storage is unavailable.
  }
}

export async function initApiBaseUrl(): Promise<string> {
  if (initialized) {
    return runtimeBaseUrl;
  }

  let stored: string | null = null;
  try {
    stored = await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    stored = null;
  }

  const discovered = await discoverWorkingApiBaseUrl(stored);
  runtimeBaseUrl = discovered;
  initialized = true;
  await persistApiBaseUrl(discovered);
  return runtimeBaseUrl;
}

export async function refreshApiBaseUrl(): Promise<string> {
  let stored: string | null = null;
  try {
    stored = await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    stored = null;
  }

  const discovered = await discoverWorkingApiBaseUrl(stored);
  runtimeBaseUrl = discovered;
  initialized = true;
  await persistApiBaseUrl(discovered);
  return runtimeBaseUrl;
}

export async function saveApiBaseUrl(url: string): Promise<string> {
  const normalized = normalizeApiBaseUrl(url);
  if (!normalized) {
    throw new Error('API URL cannot be empty');
  }

  runtimeBaseUrl = normalized;
  initialized = true;
  await persistApiBaseUrl(normalized);
  return normalized;
}

export async function resetApiBaseUrl(): Promise<string> {
  const autoUrl = getAutoDetectedApiBaseUrl();
  runtimeBaseUrl = autoUrl;
  initialized = true;
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // ignore missing or unavailable storage
  }
  return runtimeBaseUrl;
}
