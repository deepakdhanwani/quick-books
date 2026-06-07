import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { appAlert } from './appAlert';
import { showDownloadNotification } from './downloadNotifications';
import {
  resolveMimeType,
  sanitizePaymentProofFileName,
} from './paymentProofFiles';

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

async function ensureDownloadsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
}

export async function downloadPaymentProof(
  token: string,
  url: string,
  fileName?: string,
): Promise<void> {
  const safeName = sanitizePaymentProofFileName(fileName);

  try {
    if (Platform.OS === 'web') {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Could not download payment proof');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return;
    }

    await ensureDownloadsDir();

    const dest = `${DOWNLOADS_DIR}${safeName}`;
    const result = await FileSystem.downloadAsync(url, dest, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error('Could not download payment proof');
    }

    const mimeType = resolveMimeType(
      safeName,
      result.headers?.['content-type'] ?? result.headers?.['Content-Type'],
    );

    const notified = await showDownloadNotification(safeName, result.uri, mimeType);
    if (!notified) {
      appAlert(
        'Download complete',
        `${safeName} was saved. Allow notifications to get a download alert you can tap to open the file.`,
      );
    }
  } catch (err) {
    appAlert(
      'Download failed',
      err instanceof Error ? err.message : 'Could not download payment proof',
    );
  }
}
