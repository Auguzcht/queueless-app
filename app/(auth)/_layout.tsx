import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  if (session) return <Redirect href="/(tabs)/home" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
