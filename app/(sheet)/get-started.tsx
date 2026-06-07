import { View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

export default function GetStartedSheet() {
  return (
    <View className="flex-1 bg-white px-6 pt-2 pb-10 gap-6">
      <View className="w-10 h-1 bg-border rounded-full self-center mb-3" />
      <Text variant="h3" className="text-foreground text-center">Get Started with QueueLess</Text>
      <Text variant="p" className="text-center">Join the virtual queue from anywhere on campus. No more waiting in line.</Text>
      <View className="gap-3">
        <Button size="lg" className="w-full" onPress={() => { router.back(); router.push('/(auth)/onboarding'); }}>
          <Icon as={UserPlus} size={20} color="#FFFFFF" />
          <Text>Create Account</Text>
        </Button>
        <Button size="lg" variant="outline" className="w-full" onPress={() => { router.back(); router.push('/(auth)/login'); }}>
          <Icon as={LogIn} size={20} color="#1A1A2E" />
          <Text className="text-foreground">Sign In</Text>
        </Button>
      </View>
      <Text variant="muted" className="text-center">By continuing, you agree to our Terms of Service and Privacy Policy.</Text>
    </View>
  );
}
