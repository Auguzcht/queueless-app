import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { FadeInDown, FadeInUp } from '@/hooks/useAnimated';

export default function VerifyEmailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Animated.View entering={FadeInDown.duration(400)} className="bg-primary pt-20 pb-12 px-6 items-center rounded-b-[32px]">
        <Image source={require('@/assets/QueueLess-Logo-Transparent.png')} className="w-20 h-20 mb-4" resizeMode="contain" />
        <Text variant="h1" className="text-white font-display">QueueLess</Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(400).delay(200)} className="flex-1 justify-center items-center px-8 -mt-8">
        <View className="bg-card rounded-2xl p-8 items-center shadow-sm border border-border w-full">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-5">
            <Icon as={Mail} size={28} color="#004E98" />
          </View>
          <Text variant="h4" className="text-foreground text-center mb-2">Check your email</Text>
          <Text variant="muted" className="text-center mb-8 leading-5">
            We sent a verification link to your MMCM email. Please click it to continue.
          </Text>
          <Button onPress={() => router.replace('/login')} className="w-full"><Text>Back to Login</Text></Button>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
