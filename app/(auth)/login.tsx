import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/auth/LoginForm';
import { FadeInUp } from '@/hooks/useAnimated';
import { Stack, router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

import { authService } from '@/services/auth.service';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export default function LoginScreen() {
  const [showForgotSheet, setShowForgotSheet] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!resetEmail.includes('@')) return;
    try {
      await authService.resetPassword(resetEmail);
      setResetSent(true);
      setTimeout(() => { setShowForgotSheet(false); setResetSent(false); setResetEmail(''); }, 2000);
    } catch {}
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true,
        title: 'Sign In',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#111827',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 5 }}>
            <Icon as={ChevronLeft} size={24} color="#111827" />
          </TouchableOpacity>
        ),
      }} />
      <LinearGradient colors={['#EEF2FF', '#E0E7FF', '#F8FAFC']} className="absolute inset-0" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="flex-1 px-6 justify-center items-center" style={{ marginTop: -100 }}>
              <Image source={require('../../assets/QueueLess-Logo-Transparent.png')} className="w-14 h-14 mb-4" resizeMode="contain" />
              <View className="bg-white/95 rounded-3xl p-6 shadow-sm border border-indigo-100/50 w-full">
                <Text variant="h2" className="text-foreground font-display mb-1 text-center">Welcome back</Text>
                <Text className="text-muted-foreground text-sm mb-6 font-body text-center">Sign in to your account</Text>
                <LoginForm onSuccess={() => router.replace('/(tabs)/home')} onForgotPress={() => setShowForgotSheet(true)} />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <BottomSheet visible={showForgotSheet} onClose={() => { setShowForgotSheet(false); setResetSent(false); setResetEmail(''); }}>
        <View className="items-center gap-1">
          <TouchableOpacity onPress={() => setShowForgotSheet(false)} className="self-end p-1 mb-2">
            <Icon as={X} size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text variant="h3" className="text-foreground text-center">Reset Password</Text>
          <Text variant="p" className="text-center">Enter your email and we'll send you a reset link.</Text>
        </View>
        <View className="gap-3 mt-6">
          {resetSent ? (
            <Text className="text-success text-center font-medium">Check your email for the reset link.</Text>
          ) : (
            <>
              <Input placeholder="your@mcm.edu.ph" keyboardType="email-address" autoCapitalize="none" value={resetEmail} onChangeText={setResetEmail} />
              <Button size="lg" className="w-full" onPress={handleForgotPassword} disabled={!resetEmail.includes('@')}>
                <Text>Send Reset Link</Text>
              </Button>
            </>
          )}
        </View>
        <Text variant="muted" className="text-center mt-6">We'll send a reset link to your email.</Text>
      </BottomSheet>
    </View>
  );
}
