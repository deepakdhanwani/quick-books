import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import { appAlert } from './appAlert';

export async function openDownloadedFile(fileUri: string, mimeType: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: mimeType,
      });
      return;
    }

    if (Platform.OS === 'ios') {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType });
        return;
      }
      await Linking.openURL(fileUri);
      return;
    }

    await Linking.openURL(fileUri);
  } catch (err) {
    appAlert(
      'Could not open file',
      err instanceof Error ? err.message : 'No app found to open this file type.',
    );
  }
}
