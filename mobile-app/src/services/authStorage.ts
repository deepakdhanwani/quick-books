import * as SecureStore from 'expo-secure-store';
import { SubscriberAuthResponse } from './api';

const AUTH_SESSION_KEY = 'quickbooks_auth_session';

export async function saveAuthSession(auth: SubscriberAuthResponse): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(auth));
  } catch {
    // Session still works for the current app run.
  }
}

export async function loadAuthSession(): Promise<SubscriberAuthResponse | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SubscriberAuthResponse;
    if (!parsed?.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
}
