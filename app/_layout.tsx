import '../global.css';
import { useEffect } from 'react';
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

  useEffect(() => {
    authService.getSession()
      .then((s) => useAuthStore.getState().setSession(s))
      .catch(() => useAuthStore.getState().setSession(null));
    const { data: listener } = authService.onAuthStateChange((s) => {
      useAuthStore.getState().setSession(s);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  useEffect(() => { try { SplashScreen.hideAsync(); } catch {} }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={session ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="queue" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="admin" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: true, title: 'Notifications' }} />
      </Stack>
      <PortalHost />
    </GestureHandlerRootView>
  );
}
