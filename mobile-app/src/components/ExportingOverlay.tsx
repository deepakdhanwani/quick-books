import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';

type ExportingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function ExportingOverlay({ visible, message = 'Preparing PDF...' }: ExportingOverlayProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return {
    overlay: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'rgba(15, 20, 25, 0.35)',
      gap: 12,
      paddingHorizontal: 24,
    },
    message: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(14),
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
  };
}
