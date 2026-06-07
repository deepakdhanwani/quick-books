import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AlertProvider } from './src/components/AlertProvider';
import { AppShell } from './src/navigation/AppShell';
import { LoginScreen } from './src/screens/LoginScreen';
import { api, initApiBaseUrl, SubscriberAuthResponse } from './src/services/api';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './src/services/authStorage';
import { colors } from './src/theme/colors';
import {
  initDownloadNotifications,
  registerDownloadNotificationHandler,
} from './src/utils/downloadNotifications';

export default function App() {
  const [auth, setAuth] = useState<SubscriberAuthResponse | null>(null);
  const [ready, setReady] = useState(false);

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

      const storedAuth = await loadAuthSession();
      if (storedAuth) {
        try {
          const profile = await api.getAccountProfile(storedAuth.token);
          const refreshedAuth: SubscriberAuthResponse = {
            ...storedAuth,
            subscriptionStatus: profile.subscriptionStatus,
            requiresSubscription: profile.subscriptionStatus !== 'ACTIVE',
          };
          await saveAuthSession(refreshedAuth);
          setAuth(refreshedAuth);
        } catch {
          await clearAuthSession();
        }
      }

      setReady(true);
    };

    bootstrap();
  }, []);

  const handleLogin = async (response: SubscriberAuthResponse) => {
    await saveAuthSession(response);
    setAuth(response);
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setAuth(null);
  };

  const handleSubscriptionChanged = useCallback(async (nextAuth: SubscriberAuthResponse) => {
    setAuth(nextAuth);
    await saveAuthSession(nextAuth);
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <AlertProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        {auth ? (
          <AppShell
            auth={auth}
            onLogout={handleLogout}
            onSubscriptionChanged={handleSubscriptionChanged}
          />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </View>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
