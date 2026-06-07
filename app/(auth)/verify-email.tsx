import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-8">
        <Mail size={48} color="#004E98" className="mb-6" />
        <Text variant="h2" className="text-center mb-2">Check your email</Text>
        <Text variant="muted" className="text-center mb-8 leading-5">We sent a verification link to your MMCM email.</Text>
        <Button onPress={() => router.replace('/login')} className="w-full">
          <Text>Back to Login</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
