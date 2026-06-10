import { useEffect } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { notificationService } from '@/services/notification.service';

export function usePushNotifications() {
  useEffect(() => {
    // expo-notifications native module is removed from Expo Go Android SDK 53+
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return;

    let Notifications: any;
    try {
      Notifications = require('expo-notifications');
    } catch {
      return; // Module not available
    }

    registerPushToken(Notifications);

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {}

    let notificationSub: any = null;
    let responseSub: any = null;
    try {
      notificationSub = Notifications.addNotificationReceivedListener(() => {
        const userId = useAuthStore.getState().session?.user?.id;
        if (userId) {
          notificationService.getUnreadCount(userId).then(() => {}).catch(() => {});
        }
      });
      responseSub = Notifications.addNotificationResponseReceivedListener(() => {});
    } catch {}

    return () => {
      try { if (notificationSub) notificationSub.remove(); } catch {}
      try { if (responseSub) responseSub.remove(); } catch {}
    };
  }, []);
}

async function registerPushToken(Notifications: any) {
  try {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('queue-updates', {
        name: 'Queue Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#004E98',
      });
    }

    const tokenOptions: any = {};
    if (process.env.EXPO_PUBLIC_PROJECT_ID) {
      tokenOptions.projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    }
    const token = await Notifications.getExpoPushTokenAsync(tokenOptions);

    const platform = Platform.OS as 'ios' | 'android';
    await notificationService.registerPushToken(token.data, platform);
  } catch (err) {
    console.warn('Push notification skipped:', (err as Error).message);
  }
}
