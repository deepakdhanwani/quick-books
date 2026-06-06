import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme/colors';

export default function App() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {token ? (
        <DashboardScreen onLogout={() => setToken(null)} />
      ) : (
        <LoginScreen onLogin={setToken} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
