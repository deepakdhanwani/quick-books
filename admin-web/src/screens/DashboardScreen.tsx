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
      <Text style={styles.title}>Admin Dashboard</Text>
      <Card>
        <Text style={styles.text}>Manage subscribers, plans, taxes, discounts, and reports.</Text>
        <View style={styles.menu}>
          <Text style={styles.menuItem}>• Subscribers</Text>
          <Text style={styles.menuItem}>• Subscription Plans</Text>
          <Text style={styles.menuItem}>• Taxes</Text>
          <Text style={styles.menuItem}>• Discounts</Text>
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
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
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
