import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { openDownloadedFile } from './openDownloadedFile';

const DOWNLOAD_CHANNEL_ID = 'downloads';

async function handleDownloadNotificationResponse(
  response: Notifications.NotificationResponse | null,
): Promise<void> {
  if (!response) {
    return;
  }

  const data = response.notification.request.content.data;
  const fileUri = typeof data.fileUri === 'string' ? data.fileUri : null;
  const mimeType = typeof data.mimeType === 'string' ? data.mimeType : 'application/octet-stream';

  if (fileUri) {
    await openDownloadedFile(fileUri, mimeType);
  }
}

export async function initDownloadNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DOWNLOAD_CHANNEL_ID, {
      name: 'Downloads',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    const openedSecondsAgo = (Date.now() - lastResponse.notification.date) / 1000;
    if (openedSecondsAgo < 30) {
      await handleDownloadNotificationResponse(lastResponse);
    }
  }
}

export async function showDownloadNotification(
  fileName: string,
  fileUri: string,
  mimeType: string,
): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Download complete',
      body: `${fileName} — tap to open`,
      data: { fileUri, mimeType, fileName },
      ...(Platform.OS === 'android' ? { channelId: DOWNLOAD_CHANNEL_ID } : {}),
    },
    trigger: null,
  });

  return true;
}

export function registerDownloadNotificationHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    void handleDownloadNotificationResponse(response);
  });

  return () => subscription.remove();
}
