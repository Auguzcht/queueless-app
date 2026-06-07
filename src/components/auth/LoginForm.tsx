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

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthStore();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try { setError(null); await signIn(data); router.replace('/(tabs)/home'); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <View className="gap-3">
      {error && <Text variant="small" className="text-destructive text-center">{error}</Text>}

      <Controller name="email" control={control} render={({ field }) => (
        <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={field.value} onChangeText={field.onChange} />
      )} />
      {errors.email && <Text variant="small" className="text-destructive">{errors.email.message}</Text>}

      <Controller name="password" control={control} render={({ field }) => (
        <Input placeholder="Enter your password" secureTextEntry value={field.value} onChangeText={field.onChange} />
      )} />
      {errors.password && <Text variant="small" className="text-destructive">{errors.password.message}</Text>}

      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text variant="small" className="text-primary-light text-right mb-2">Forgot password?</Text>
      </TouchableOpacity>

      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full">
        <Text>{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
      </Button>

      <TouchableOpacity onPress={() => router.push('/register')} className="items-center mt-4">
        <Text variant="muted">Don't have an account? <Text variant="small" className="text-primary font-semibold">Sign up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
