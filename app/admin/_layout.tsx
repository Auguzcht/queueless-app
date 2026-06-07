import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AdminLayout() {
  const profile = useAuthStore((s) => s.profile);
  if (!profile || !['staff', 'admin'].includes(profile.role)) return <Redirect href="/(tabs)/home" />;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="index" /><Stack.Screen name="department/[id]" /></Stack>;
}
