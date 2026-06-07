import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COLORS, SPACING, FONTS, FONT_SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuthStore();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '', middleName: '', lastName: '',
      email: '', password: '', confirmPassword: '', studentId: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError(null);
      await signUp(data);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Controller
        name="firstName"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="Juan"
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Controller
        name="middleName"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="M."
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Controller
        name="lastName"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="Dela Cruz"
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="your@mcm.edu.ph"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Controller
        name="studentId"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="2024-XXXXX"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="Min. 8 characters"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <Input

            placeholder="Repeat your password"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}

          />
        )}
      />

      <Button onPress={handleSubmit(onSubmit)} >Create Account</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  error: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});
