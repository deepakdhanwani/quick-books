import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { Input } from '../components/Input';
import {
  api,
  checkApiHealth,
  getApiBaseUrl,
  getAutoDetectedApiBaseUrl,
  initApiBaseUrl,
  refreshApiBaseUrl,
  SubscriberAuthResponse,
} from '../services/api';
import { getDetectedDevServerHost } from '../services/apiDiscovery';
import { colors } from '../theme/colors';

type LoginScreenProps = {
  onLogin: (response: SubscriberAuthResponse) => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeApiUrl, setActiveApiUrl] = useState(getAutoDetectedApiBaseUrl());
  const [configReady, setConfigReady] = useState(false);

  const [checkingConnection, setCheckingConnection] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const runConnectionCheck = useCallback(async (url?: string) => {
    const targetUrl = url ?? getApiBaseUrl();
    setCheckingConnection(true);
    const result = await checkApiHealth(targetUrl);
    setConnectionOk(result.ok);
    setConnectionMessage(result.message);
    setCheckingConnection(false);
    return result;
  }, []);

  const applyDiscoveredUrl = useCallback(async () => {
    const url = await refreshApiBaseUrl();
    setActiveApiUrl(url);
    return runConnectionCheck(url);
  }, [runConnectionCheck]);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      const url = await initApiBaseUrl();
      if (cancelled) {
        return;
      }

      setActiveApiUrl(url);
      setConfigReady(true);
      await runConnectionCheck(url);
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [runConnectionCheck]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const url = await refreshApiBaseUrl();
      setActiveApiUrl(url);
      await runConnectionCheck(url);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.subscriberLogin(phone, loginPin);
      onLogin(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!configReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Detecting backend connection...</Text>
      </View>
    );
  }

  const devHost = getDetectedDevServerHost();

  return (
    <RefreshableScrollView
      contentContainerStyle={styles.scrollContent}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <Text style={styles.title}>Quick Books</Text>
      <Text style={styles.subtitle}>Subscriber App</Text>

      <Card style={styles.debugCard}>
        <Text style={styles.debugTitle}>Backend connection (temporary)</Text>

        <Text style={styles.debugLabel}>Auto-detected API endpoint</Text>
        <Text style={styles.debugValue} selectable>
          {activeApiUrl}
        </Text>

        <Text style={styles.debugLabel}>Detection source</Text>
        <Text style={styles.debugMeta}>
          {devHost
            ? `Expo dev server host: ${devHost} (same PC running Metro)`
            : 'Using platform fallback (emulator or localhost)'}
        </Text>

        <Text style={styles.debugLabel}>Health check</Text>
        <View style={styles.connectionRow}>
          {checkingConnection ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.connectionStatus, connectionOk ? styles.connectionOk : styles.connectionError]}>
              {connectionOk ? 'Connected' : 'Not reachable'} — {connectionMessage}
            </Text>
          )}
        </View>

        <Text style={styles.debugHint}>
          The app picks your PC IP from the Expo connection automatically, then tests /api/health on port 9090.
          No manual URL entry needed in Expo Go.
        </Text>

        <Button
          title="Recheck Connection"
          onPress={applyDiscoveredUrl}
          variant="secondary"
          loading={checkingConnection}
        />
      </Card>

      <Card>
        <Input label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input
          label="Login PIN"
          value={loginPin}
          onChangeText={setLoginPin}
          secureTextEntry
          enableVisibilityToggle
          keyboardType="number-pad"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Sign In" onPress={handleLogin} loading={loading} />
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  debugCard: {
    marginBottom: 16,
  },
  debugTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
    marginTop: 8,
  },
  debugValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  debugMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  connectionRow: {
    minHeight: 24,
    justifyContent: 'center',
    marginTop: 4,
  },
  connectionStatus: {
    fontSize: 14,
  },
  connectionOk: {
    color: colors.success,
  },
  connectionError: {
    color: colors.error,
  },
  debugHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
});
