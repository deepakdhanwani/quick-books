import * as Sharing from 'expo-sharing';
import { appAlert } from './appAlert';

export async function shareLocalFile(uri: string, mimeType: string, dialogTitle?: string) {
  if (!(await Sharing.isAvailableAsync())) {
    appAlert('Sharing unavailable', 'File sharing is not available on this device.');
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: dialogTitle ?? 'Share PDF',
    UTI: 'com.adobe.pdf',
  });
}
