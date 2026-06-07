import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 pb-16" keyboardShouldPersistTaps="handled">
          <Text variant="h1" className="text-primary text-center mb-1">QueueLess</Text>
          <Text variant="muted" className="text-center mb-12">Skip the line. Save your time.</Text>
          <LoginForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
