import { KeyboardAvoidingView, Platform, ScrollView, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { FadeInDown, FadeInUp } from '@/hooks/useAnimated';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(400)} className="bg-primary pt-16 pb-10 px-6 items-center rounded-b-[32px]">
            <Image source={require('@/assets/QueueLess-Logo-Transparent.png')} className="w-16 h-16 mb-3" resizeMode="contain" />
            <Text variant="h2" className="text-white font-display">Join QueueLess</Text>
            <Text className="text-white/70 text-sm mt-1">Create your account</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-6 -mt-5">
            <View className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <RegisterForm />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
