import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ResetPasswordInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try { setError(null); await authService.resetPassword(data.email); setSent(true); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-center px-6">
          <Text variant="h2" className="text-foreground mb-1">Reset Password</Text>
          <Text variant="muted" className="mb-8">Enter your MMCM email to get a reset link.</Text>

          {error && <Text variant="small" className="text-destructive text-center mb-4">{error}</Text>}

          {sent ? (
            <Text variant="default" className="text-success text-center">Check your email for the reset link.</Text>
          ) : (
            <>
              <Controller name="email" control={control} render={({ field }) => (
                <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />
              )} />
              <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full mt-4">
                <Text>Send Reset Link</Text>
              </Button>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
