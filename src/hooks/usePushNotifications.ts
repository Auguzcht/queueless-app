import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { notificationService } from '@/services/notification.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  useEffect(() => {
    registerPushToken();

    const notificationSub = Notifications.addNotificationReceivedListener(() => {
      const userId = useAuthStore.getState().session?.user?.id;
      if (userId) {
        notificationService.getUnreadCount(userId).then((count) => {
          useAuthStore.getState().fetchProfile();
        });
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
    });

    return () => {
      notificationSub.remove();
      responseSub.remove();
    };
  }, []);

  async function registerPushToken() {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('queue-updates', {
        name: 'Queue Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#004E98',
      });
    }

    try {
      const tokenOptions: any = {};
      if (process.env.EXPO_PUBLIC_PROJECT_ID) {
        tokenOptions.projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      }
      const token = await Notifications.getExpoPushTokenAsync(tokenOptions);

      const platform = Platform.OS as 'ios' | 'android';
      await notificationService.registerPushToken(token.data, platform);
    } catch (err) {
      console.warn('Push token registration skipped (set EXPO_PUBLIC_PROJECT_ID in .env to enable):', (err as Error).message);
    }
  }
}
