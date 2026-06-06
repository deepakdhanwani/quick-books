import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';

type DashboardScreenProps = {
  onLogout: () => void;
};

export function DashboardScreen({ onLogout }: DashboardScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Card>
        <Text style={styles.text}>Log sales, purchases, and manage your business.</Text>
        <View style={styles.menu}>
          <Text style={styles.menuItem}>• Customers</Text>
          <Text style={styles.menuItem}>• Vendors</Text>
          <Text style={styles.menuItem}>• Sales</Text>
          <Text style={styles.menuItem}>• Purchases</Text>
          <Text style={styles.menuItem}>• Pending Payments</Text>
          <Text style={styles.menuItem}>• Reports</Text>
        </View>
        <Button title="Sign Out" onPress={onLogout} variant="secondary" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  text: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  menu: {
    marginBottom: 24,
  },
  menuItem: {
    color: colors.text,
    fontSize: 16,
    marginBottom: 8,
  },
});
