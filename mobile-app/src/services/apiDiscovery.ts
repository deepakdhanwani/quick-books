import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { BACKEND_PORT, DEFAULT_API_BASE_URL, buildApiBaseUrl, normalizeApiBaseUrl } from './apiUrl';

function parseHostFromConnectionUri(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const withScheme = value.includes('://') ? value : `http://${value}`;
    const url = new URL(withScheme);
    const host = url.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
    return host;
  } catch {
    const stripped = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    const host = stripped.split(':')[0]?.split('/')[0]?.trim();
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
    return host;
  }
}

export function getDetectedDevServerHost(): string | null {
  const sources = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
    Constants.experienceUrl,
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost,
  ];

  for (const source of sources) {
    const host = parseHostFromConnectionUri(source);
    if (host) {
      return host;
    }
  }

  return null;
}

export function getAutoDetectedApiBaseUrl(): string {
  const devHost = getDetectedDevServerHost();
  if (devHost) {
    return buildApiBaseUrl(devHost, BACKEND_PORT);
  }

  if (Platform.OS === 'android') {
    return buildApiBaseUrl('10.0.2.2', BACKEND_PORT);
  }

  return buildApiBaseUrl('localhost', BACKEND_PORT);
}

export function getApiBaseUrlCandidates(): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const add = (url: string) => {
    const normalized = normalizeApiBaseUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      candidates.push(normalized);
    }
  };

  const devHost = getDetectedDevServerHost();
  if (devHost) {
    add(buildApiBaseUrl(devHost, BACKEND_PORT));
  }

  if (Platform.OS === 'android') {
    add(buildApiBaseUrl('10.0.2.2', BACKEND_PORT));
  }

  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    add(buildApiBaseUrl('localhost', BACKEND_PORT));
  }

  add(normalizeApiBaseUrl(DEFAULT_API_BASE_URL));

  return candidates;
}

async function probeHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${normalizeApiBaseUrl(baseUrl)}/api/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function discoverWorkingApiBaseUrl(storedUrl?: string | null): Promise<string> {
  const candidates = getApiBaseUrlCandidates();

  if (storedUrl) {
    const normalizedStored = normalizeApiBaseUrl(storedUrl);
    if (!candidates.includes(normalizedStored)) {
      candidates.unshift(normalizedStored);
    }
  }

  for (const candidate of candidates) {
    if (await probeHealth(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
}
