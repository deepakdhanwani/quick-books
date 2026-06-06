import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { AdminShell } from './src/screens/AdminShell';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme/colors';
import { clearStoredToken, getStoredToken, isTokenExpired, setStoredToken } from './src/utils/authStorage';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored && !isTokenExpired(stored)) {
      setToken(stored);
    } else if (stored) {
      clearStoredToken();
    }
    setBootstrapping(false);
  }, []);

  const handleLogin = (newToken: string) => {
    setStoredToken(newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {bootstrapping ? (
        <View style={styles.bootstrapping}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : token ? (
        <AdminShell token={token} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    minHeight: '100vh' as unknown as number,
  },
  bootstrapping: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
