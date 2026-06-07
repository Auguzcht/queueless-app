import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 pt-12 pb-12" keyboardShouldPersistTaps="handled">
          <Text variant="h2" className="text-foreground mb-1">Create Account</Text>
          <Text variant="muted" className="mb-8">Join QueueLess with your MMCM email</Text>
          <RegisterForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
