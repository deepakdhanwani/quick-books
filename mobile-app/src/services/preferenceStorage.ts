import * as SecureStore from 'expo-secure-store';
import type { UserPreferences } from '../theme/types';
import { DEFAULT_PREFERENCES } from '../theme/types';

const STORAGE_KEY = 'quickbooks_user_preferences';

export async function saveCachedPreferences(preferences: UserPreferences): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore secure-store failures.
  }
}

export async function loadCachedPreferences(): Promise<UserPreferences> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored) as Partial<UserPreferences>;
    return {
      theme: parsed.theme === 'LIGHT' ? 'LIGHT' : 'DARK',
      fontSize:
        parsed.fontSize === 'LARGE' || parsed.fontSize === 'EXTRA_SMALL'
          ? parsed.fontSize
          : 'SMALL',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function clearCachedPreferences(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Ignore secure-store failures.
  }
}
