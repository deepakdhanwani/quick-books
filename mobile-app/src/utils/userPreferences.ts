import type { SubscriberAccountProfile } from '../services/api';
import type { UserPreferences } from '../theme/types';
import { DEFAULT_PREFERENCES } from '../theme/types';

export function toUserPreferences(
  profile?: Pick<SubscriberAccountProfile, 'theme' | 'fontSize'> | null,
): UserPreferences {
  if (!profile?.theme && !profile?.fontSize) {
    return DEFAULT_PREFERENCES;
  }

  return {
    theme: profile.theme === 'LIGHT' ? 'LIGHT' : 'DARK',
    fontSize:
      profile.fontSize === 'LARGE' || profile.fontSize === 'EXTRA_SMALL'
        ? profile.fontSize
        : 'SMALL',
  };
}
