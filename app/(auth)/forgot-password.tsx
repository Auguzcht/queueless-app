import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ResetPasswordInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authService } from '@/services/auth.service';
import { FadeInDown, FadeInUp } from '@/hooks/useAnimated';

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try { setError(null); await authService.resetPassword(data.email); setSent(true); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1">
          <Animated.View entering={FadeInDown.duration(400)} className="bg-primary pt-16 pb-10 px-6 items-center rounded-b-[32px]">
            <Image source={require('../../assets/QueueLess-Logo-Transparent.png')} className="w-16 h-16 mb-3" resizeMode="contain" />
            <Text variant="h2" className="text-white font-display">Reset Password</Text>
            <Text className="text-white/70 text-sm mt-1">We'll send you a reset link</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="flex-1 px-6 -mt-5 justify-center">
            <View className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              {error && <Text variant="small" className="text-destructive text-center mb-4">{error}</Text>}
              {sent ? (
                <Text className="text-success text-center">Check your email for the reset link.</Text>
              ) : (
                <>
                  <Controller name="email" control={control} render={({ field }) => (
                    <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />
                  )} />
                  <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full mt-4"><Text>Send Reset Link</Text></Button>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
