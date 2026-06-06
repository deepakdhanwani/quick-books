import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { api, SubscriberAuthResponse } from '../services/api';
import { colors } from '../theme/colors';

type LoginScreenProps = {
  onLogin: (response: SubscriberAuthResponse) => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Books</Text>
      <Text style={styles.subtitle}>Subscriber App</Text>
      <Card>
        <Input label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Login PIN" value={loginPin} onChangeText={setLoginPin} secureTextEntry keyboardType="number-pad" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Sign In" onPress={handleLogin} loading={loading} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
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
    marginBottom: 32,
    marginTop: 8,
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
});
