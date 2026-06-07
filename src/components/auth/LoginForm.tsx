import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useScalePress } from '@/hooks/useAnimated';
import Animated from 'react-native-reanimated';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthStore();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  });
  const { animatedStyle, pressIn, pressOut } = useScalePress();

  const onSubmit = async (data: LoginInput) => {
    try { setError(null); await signIn(data); router.replace('/(tabs)/home'); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <View className="gap-4">
      {error && (
        <View className="bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/20">
          <Text variant="small" className="text-destructive text-center">{error}</Text>
        </View>
      )}

      <View className="gap-1">
        <Text variant="small" className="text-foreground font-medium mb-1">Email</Text>
        <Controller name="email" control={control} render={({ field }) => (
          <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            value={field.value} onChangeText={field.onChange}
          />
        )} />
        {errors.email && <Text variant="small" className="text-destructive">{errors.email.message}</Text>}
      </View>

      <View className="gap-1">
        <Text variant="small" className="text-foreground font-medium mb-1">Password</Text>
        <Controller name="password" control={control} render={({ field }) => (
          <Input placeholder="Enter your password" secureTextEntry value={field.value} onChangeText={field.onChange}
          />
        )} />
        {errors.password && <Text variant="small" className="text-destructive">{errors.password.message}</Text>}
      </View>

      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text variant="small" className="text-primary-light text-right">Forgot password?</Text>
      </TouchableOpacity>

      <Animated.View style={animatedStyle}>
        <Button onPressIn={pressIn} onPressOut={pressOut} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full">
          <Icon as={LogIn} size={18} color="#FFFFFF" />
          <Text>{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
        </Button>
      </Animated.View>

      <View className="flex-row justify-center items-center mt-2 gap-2">
        <View className="h-px flex-1 bg-border" />
        <Text variant="small" className="text-muted-foreground">or</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <TouchableOpacity onPress={() => router.push('/register')} className="items-center py-2">
        <Text variant="muted">New here? <Text className="text-primary font-semibold">Create account</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
