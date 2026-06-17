import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AlertProvider } from './src/components/AlertProvider';
import { AppShell } from './src/navigation/AppShell';
import { LoginScreen } from './src/screens/LoginScreen';
import { api, initApiBaseUrl, setActiveCompanyId, SubscriberAuthResponse } from './src/services/api';
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

      const cachedPreferences = await loadCachedPreferences();
      setInitialPreferences(cachedPreferences);

      const storedAuth = await loadAuthSession();
      if (storedAuth) {
        try {
          const profile = await api.getAccountProfile(storedAuth.token);
          const preferences = toUserPreferences(profile);
          await saveCachedPreferences(preferences);
          setInitialPreferences(preferences);

          const refreshedAuth: SubscriberAuthResponse = {
            ...storedAuth,
            subscriptionStatus: profile.subscriptionStatus,
            requiresSubscription: profile.subscriptionStatus !== 'ACTIVE',
            userName: profile.loggedInUserName ?? storedAuth.userName,
            userType: profile.userType ?? storedAuth.userType,
            canChangePin: profile.canChangePin ?? storedAuth.canChangePin,
          };
          await saveAuthSession(refreshedAuth);
          setAuth(refreshedAuth);
          setActiveCompanyId(refreshedAuth.activeCompanyId);
        } catch {
          await clearAuthSession();
        }
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
    const selectedCompanyId = response.activeCompanyId ?? response.companies?.[0]?.id;
    const normalizedResponse = { ...response, activeCompanyId: selectedCompanyId };
    setActiveCompanyId(selectedCompanyId);
    await saveAuthSession(normalizedResponse);

    try {
      const profile = await api.getAccountProfile(normalizedResponse.token);
      const preferences = toUserPreferences(profile);
      await saveCachedPreferences(preferences);
      setInitialPreferences(preferences);
    } catch {
      // Keep cached/default preferences if profile fetch fails right after login.
    }

    setAuth(normalizedResponse);
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
