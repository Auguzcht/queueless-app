import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AdminLayout() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  if (!session) return <Redirect href="/" />;
  if (!profile || !['staff', 'admin'].includes(profile.role)) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Staff Dashboard' }} />
      <Stack.Screen name="department/[id]" options={{ title: 'Manage Queue' }} />
    </Stack>
  );
}
