import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AlertProvider } from './src/components/AlertProvider';
import { AppShell } from './src/navigation/AppShell';
import { LoginScreen } from './src/screens/LoginScreen';
import { api, ApiRequestError, initApiBaseUrl, setActiveCompanyId, SubscriberAuthResponse } from './src/services/api';
import { initDebugLog } from './src/services/debugLog';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './src/services/authStorage';
import { loadCachedPreferences, saveCachedPreferences } from './src/services/preferenceStorage';
import { AppThemeProvider } from './src/theme/AppThemeContext';
import { getStatusBarStyle } from './src/theme/palettes';
import { useAppTheme } from './src/theme/AppThemeContext';
import type { UserPreferences } from './src/theme/types';
import { DEFAULT_PREFERENCES } from './src/theme/types';
import { toUserPreferences } from './src/utils/userPreferences';
import { useThemedStyles } from './src/theme/useThemedStyles';
import type { AppTheme } from './src/theme/types';
import {
  initDownloadNotifications,
  registerDownloadNotificationHandler,
} from './src/utils/downloadNotifications';

function AppContent({
  auth,
  ready,
  onLogout,
  onLogin,
  onSubscriptionChanged,
}: {
  auth: SubscriberAuthResponse | null;
  ready: boolean;
  onLogout: () => void | Promise<void>;
  onLogin: (response: SubscriberAuthResponse) => void | Promise<void>;
  onSubscriptionChanged: (auth: SubscriberAuthResponse) => void | Promise<void>;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={getStatusBarStyle(theme.mode)} />
      {auth ? (
        <AppShell
          auth={auth}
          onLogout={onLogout}
          onSubscriptionChanged={onSubscriptionChanged}
        />
      ) : (
        <LoginScreen onLogin={onLogin} />
      )}
    </View>
  );
}

function buildAuthFromLogin(response: SubscriberAuthResponse): SubscriberAuthResponse {
  const selectedCompanyId = response.activeCompanyId ?? response.companies?.[0]?.id;
  return {
    ...response,
    activeCompanyId: selectedCompanyId,
    userType: response.userType ?? 'OWNER',
  };
}

async function enrichAuthFromProfile(
  auth: SubscriberAuthResponse,
): Promise<{ auth: SubscriberAuthResponse; preferences: UserPreferences }> {
  const profile = await api.getAccountProfile(auth.token);
  const preferences = toUserPreferences(profile);
  await saveCachedPreferences(preferences);

  const enriched: SubscriberAuthResponse = {
    ...auth,
    subscriptionStatus: profile.subscriptionStatus,
    requiresSubscription: profile.subscriptionStatus !== 'ACTIVE',
    userName: profile.loggedInUserName ?? auth.userName,
    userType: profile.userType ?? auth.userType,
    canChangePin: profile.canChangePin ?? auth.canChangePin,
    staffPermissions: profile.staffPermissions ?? auth.staffPermissions,
    companies: profile.companies ?? auth.companies,
    activeCompanyId:
      profile.companies?.find((company) => company.id === auth.activeCompanyId)?.id
      ?? profile.companies?.[0]?.id
      ?? auth.activeCompanyId,
  };
  await saveAuthSession(enriched);
  return { auth: enriched, preferences };
}

function shouldClearStoredSession(error: unknown) {
  return error instanceof ApiRequestError && error.status === 401;
}

export default function App() {
  const [auth, setAuth] = useState<SubscriberAuthResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    void initDownloadNotifications();
    const removeDownloadHandler = registerDownloadNotificationHandler();

    return () => {
      removeDownloadHandler();
    };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      await initApiBaseUrl();
      await initDebugLog();

      const cachedPreferences = await loadCachedPreferences();
      setInitialPreferences(cachedPreferences);

      const storedAuth = await loadAuthSession();
      if (storedAuth) {
        setAuth(storedAuth);
        setActiveCompanyId(storedAuth.activeCompanyId);

        void enrichAuthFromProfile(storedAuth)
          .then(({ auth: refreshedAuth, preferences }) => {
            setInitialPreferences(preferences);
            setAuth(refreshedAuth);
            setActiveCompanyId(refreshedAuth.activeCompanyId);
          })
          .catch(async (error) => {
            if (shouldClearStoredSession(error)) {
              await clearAuthSession();
              setActiveCompanyId(null);
              setAuth(null);
            }
          });
      }

      setReady(true);
    };

    bootstrap();
  }, []);

  const handleLogout = async () => {
    isLoggingOutRef.current = true;
    await clearAuthSession();
    setActiveCompanyId(null);
    setAuth(null);
  };

  const handleSubscriptionChanged = useCallback(async (nextAuth: SubscriberAuthResponse) => {
    if (isLoggingOutRef.current) {
      return;
    }
    setAuth(nextAuth);
    setActiveCompanyId(nextAuth.activeCompanyId);
    await saveAuthSession(nextAuth);
  }, []);

  const handleLogin = async (response: SubscriberAuthResponse) => {
    isLoggingOutRef.current = false;
    const normalizedResponse = buildAuthFromLogin(response);

    setActiveCompanyId(normalizedResponse.activeCompanyId);
    await saveAuthSession(normalizedResponse);
    setAuth(normalizedResponse);

    void enrichAuthFromProfile(normalizedResponse)
      .then(({ auth: enriched, preferences }) => {
        if (isLoggingOutRef.current) {
          return;
        }
        setInitialPreferences(preferences);
        setAuth(enriched);
        setActiveCompanyId(enriched.activeCompanyId);
      })
      .catch(() => {
        // Profile refresh failed; the login session is already active.
      });
  };

  return (
    <AppThemeProvider key={`${auth?.userId ?? 'guest'}-${auth?.staffUserId ?? 'owner'}`} initialPreferences={initialPreferences}>
      <AlertProvider>
        <AppContent
          auth={auth}
          ready={ready}
          onLogout={handleLogout}
          onLogin={handleLogin}
          onSubscriptionChanged={handleSubscriptionChanged}
        />
      </AlertProvider>
    </AppThemeProvider>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loading: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
  };
}
