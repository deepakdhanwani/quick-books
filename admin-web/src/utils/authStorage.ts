import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'quickbooks_admin_token';

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

export function getStoredToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string) {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return true;
    }
    const payload = JSON.parse(atob(payloadPart)) as { exp?: number };
    if (!payload.exp) {
      return false;
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
