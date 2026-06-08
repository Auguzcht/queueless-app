import { View } from 'react-native';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </View>
  );
}
