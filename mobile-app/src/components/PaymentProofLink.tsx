import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { downloadPaymentProof } from '../utils/downloadPaymentProof';

type PaymentProofLinkProps = {
  token: string;
  proofUrl: string;
  fileName?: string;
};

export function PaymentProofLink({ token, proofUrl, fileName }: PaymentProofLinkProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPaymentProof(token, proofUrl, fileName);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Pressable style={styles.row} onPress={handleDownload} disabled={downloading}>
      {downloading ? (
        <ActivityIndicator color={theme.colors.primary} size="small" />
      ) : (
        <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
      )}
      <Text style={styles.text} numberOfLines={1}>
        {fileName ?? 'Download payment proof'}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  text: {
    color: theme.colors.primary,
    fontSize: theme.scaleFont(13),
    fontWeight: '500',
    flex: 1,
  },

  };
}
