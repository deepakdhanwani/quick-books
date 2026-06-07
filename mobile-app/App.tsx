import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppShell } from './src/navigation/AppShell';
import { LoginScreen } from './src/screens/LoginScreen';
import { api, initApiBaseUrl, SubscriberAuthResponse } from './src/services/api';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './src/services/authStorage';
import { colors } from './src/theme/colors';

export default function App() {
  const [auth, setAuth] = useState<SubscriberAuthResponse | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      await initApiBaseUrl();

      const storedAuth = await loadAuthSession();
      if (storedAuth) {
        try {
          await api.getAccountProfile(storedAuth.token);
          setAuth(storedAuth);
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

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {auth ? <AppShell auth={auth} onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />}
    </View>
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
