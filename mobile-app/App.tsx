import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { SubscriberAuthResponse } from './src/services/api';
import { colors } from './src/theme/colors';

export default function App() {
  const [auth, setAuth] = useState<SubscriberAuthResponse | null>(null);

  const handleLogout = () => setAuth(null);

  const renderScreen = () => {
    if (!auth) {
      return <LoginScreen onLogin={setAuth} />;
    }

    if (auth.requiresSubscription) {
      return (
        <SubscriptionScreen
          status={auth.subscriptionStatus === 'EXPIRED' ? 'EXPIRED' : 'NONE'}
          onLogout={handleLogout}
        />
      );
    }

    return <DashboardScreen onLogout={handleLogout} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
