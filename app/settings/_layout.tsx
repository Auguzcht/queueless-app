import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="queue-history" />
    </Stack>
  );
}
