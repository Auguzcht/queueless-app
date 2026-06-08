import { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';
import { LogIn, Eye, EyeOff } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useScalePress } from '@/hooks/useAnimated';
import Animated from 'react-native-reanimated';

interface Props {
  onSuccess?: () => void;
  onForgotPress?: () => void;
}

export function LoginForm({ onSuccess, onForgotPress }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const { signIn } = useAuthStore();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  });
  const { animatedStyle, pressIn, pressOut } = useScalePress();

  const onSubmit = async (data: LoginInput) => {
    try {
      setError(null);
      await signIn(data);
      if (onSuccess) onSuccess();
      else router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View className="gap-4">
      {error && (
        <View className="bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/20">
          <Text className="text-destructive text-sm text-center">{error}</Text>
        </View>
      )}

      <View className="gap-1">
        <Text className="text-foreground text-base font-semibold mb-1">Email</Text>
        <Controller name="email" control={control} render={({ field }) => (
          <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            value={field.value} onChangeText={field.onChange} />
        )} />
        {errors.email && <Text className="text-destructive text-sm">{errors.email.message}</Text>}
      </View>

      <View className="gap-1">
        <Text className="text-foreground text-base font-semibold mb-1">Password</Text>
        <View className="relative">
          <Controller name="password" control={control} render={({ field }) => (
            <Input placeholder="Enter your password" secureTextEntry={!showPw} value={field.value} onChangeText={field.onChange} />
          )} />
          <TouchableOpacity onPress={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <Icon as={showPw ? EyeOff : Eye} size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        {errors.password && <Text className="text-destructive text-sm">{errors.password.message}</Text>}
      </View>

      <TouchableOpacity onPress={onForgotPress}>
        <Text className="text-primary-light text-base font-medium text-right">Forgot password?</Text>
      </TouchableOpacity>

      <Animated.View style={animatedStyle}>
        <Button onPressIn={pressIn} onPressOut={pressOut} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon as={LogIn} size={18} color="#FFFFFF" />
              <Text>Sign In</Text>
            </>
          )}
        </Button>
      </Animated.View>

      <TouchableOpacity onPress={() => router.push('/(auth)/onboarding')} className="items-center py-2 mt-2">
        <Text className="text-muted-foreground text-base">New here? <Text className="text-primary font-semibold">Create account</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
