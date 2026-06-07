import { useState } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuthStore();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', middleName: '', lastName: '', email: '', password: '', confirmPassword: '', studentId: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    try { setError(null); await signUp(data); router.replace('/(tabs)/home'); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <View className="gap-3">
      {error && <Text variant="small" className="text-destructive text-center">{error}</Text>}

      <Controller name="firstName" control={control} render={({ field }) => (
        <Input placeholder="First Name" autoCapitalize="words" value={field.value} onChangeText={field.onChange} />
      )} />
      <Controller name="middleName" control={control} render={({ field }) => (
        <Input placeholder="Middle Name (optional)" autoCapitalize="words" value={field.value} onChangeText={field.onChange} />
      )} />
      <Controller name="lastName" control={control} render={({ field }) => (
        <Input placeholder="Last Name" autoCapitalize="words" value={field.value} onChangeText={field.onChange} />
      )} />
      <Controller name="email" control={control} render={({ field }) => (
        <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={field.value} onChangeText={field.onChange} />
      )} />
      <Controller name="studentId" control={control} render={({ field }) => (
        <Input placeholder="Student ID (optional)" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />
      )} />
      <Controller name="password" control={control} render={({ field }) => (
        <Input placeholder="Min. 8 characters" secureTextEntry value={field.value} onChangeText={field.onChange} />
      )} />
      <Controller name="confirmPassword" control={control} render={({ field }) => (
        <Input placeholder="Repeat password" secureTextEntry value={field.value} onChangeText={field.onChange} />
      )} />

      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full mt-2">
        <Text>{isSubmitting ? 'Creating...' : 'Create Account'}</Text>
      </Button>
    </View>
  );
}
