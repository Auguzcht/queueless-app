import '../global.css';
import { useEffect } from 'react';
import { Image } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PortalHost } from '@rn-primitives/portal';
import { authService } from '@/services/auth.service';
import { MeshProvider } from '@/lib/mesh-context';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { notificationService } from '@/services/notification.service';


try { SplashScreen.preventAutoHideAsync(); } catch {}

export default function RootLayout() {
  useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
  });
  usePushNotifications();

  const session = useAuthStore((s) => s.session);
  const avatarUrl = useAuthStore((s) => s.profile?.avatar_url);

  // Preload avatar image as soon as profile is available (from persist or fetch)
  useEffect(() => {
    if (avatarUrl) {
      Image.prefetch(avatarUrl);
    }
  }, [avatarUrl]);

  useEffect(() => {
    authService.getSession()
      .then((s) => useAuthStore.getState().setSession(s))
      .catch(() => useAuthStore.getState().setSession(null));
    const { data: listener } = authService.onAuthStateChange((s) => {
      useAuthStore.getState().setSession(s);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Global notification subscription - active on all pages
  useEffect(() => {
    const user = useAuthStore.getState().profile;
    if (!user?.id) return;
    // Fetch initial unread count
    notificationService.getUnreadCount(user.id).then((c) => {
      useNotificationStore.getState().setUnreadCount(c);
    }).catch(() => {});
    // Subscribe to real-time updates
    const unsub = useNotificationStore.getState().subscribeToNotifications(user.id);
    return unsub;
  }, [useAuthStore((s) => s.profile?.id)]);

  useEffect(() => { try { SplashScreen.hideAsync(); } catch {} }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MeshProvider>
      <StatusBar style={session ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="dash" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="queue" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="settings/*" options={{ headerShown: false }} />

          <Stack.Screen name="notifications" options={{ headerShown: false }} />
        </Stack>
      </View>
      <PortalHost />
    </MeshProvider>
    </GestureHandlerRootView>
  );
}
