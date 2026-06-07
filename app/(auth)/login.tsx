import { KeyboardAvoidingView, Platform, ScrollView, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { LoginForm } from '@/components/auth/LoginForm';
import { FadeInDown, FadeInUp } from '@/hooks/useAnimated';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(400)} className="bg-primary pt-16 pb-12 px-6 items-center rounded-b-[32px]">
            <Image source={require('@/assets/QueueLess-Logo-Transparent.png')}
              className="w-20 h-20 mb-4" resizeMode="contain" />
            <Text variant="h1" className="text-white font-display">QueueLess</Text>
            <Text variant="muted" className="text-white/70 mt-1">Skip the line. Save your time.</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-6 -mt-6">
            <View className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <LoginForm />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
