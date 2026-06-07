import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { downloadPaymentProof } from '../utils/downloadPaymentProof';

type PaymentProofLinkProps = {
  token: string;
  proofUrl: string;
  fileName?: string;
};

export function PaymentProofLink({ token, proofUrl, fileName }: PaymentProofLinkProps) {
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
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Ionicons name="download-outline" size={16} color={colors.primary} />
      )}
      <Text style={styles.text} numberOfLines={1}>
        {fileName ?? 'Download payment proof'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  text: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
