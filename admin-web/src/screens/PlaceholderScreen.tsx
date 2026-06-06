import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../theme/colors';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  features: string[];
};

export function PlaceholderScreen({ title, description, features }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <PageHeader title={title} subtitle={description} />
      <Card>
        <Text style={styles.comingSoon}>Module screen loaded</Text>
        <Text style={styles.hint}>This section is ready for implementation. Planned features:</Text>
        {features.map((feature) => (
          <Text key={feature} style={styles.feature}>
            • {feature}
          </Text>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  comingSoon: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  hint: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
  feature: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 6,
    paddingLeft: 4,
  },
});
