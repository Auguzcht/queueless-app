import { Stack } from 'expo-router';

export default function QueueLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="join" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
