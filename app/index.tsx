import { useState, useCallback } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';

import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowUpRight, LogIn, UserPlus, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

export default function WelcomeScreen() {
  const session = useAuthStore((s) => s.session);
  const [showSheet, setShowSheet] = useState(false);

  if (session) return <Redirect href="/(tabs)/home" />;

  return (
    <View className="flex-1 bg-background">

      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center">
            <Image source={require('../assets/QueueLess-Logo-Transparent.png')} className="w-32 h-32 mb-6" resizeMode="contain" />
            <Text variant="h1" className="text-foreground text-center font-display tracking-normal">QueueLess</Text>
            <Text className="text-muted-foreground text-base text-center mt-3 max-w-[300px] font-body leading-6">Skip the line. Save your time.</Text>
          </View>
        </View>
        <View className="px-6 pb-8">
          <Button size="lg" className="w-full" onPress={() => setShowSheet(true)}>
            <Text>Get Started</Text>
            <Icon as={ArrowUpRight} size={20} color="#FFFFFF" />
          </Button>
        </View>
      </SafeAreaView>

      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)}>
        <View className="items-center gap-1">
          <TouchableOpacity onPress={() => setShowSheet(false)} className="self-end p-1 mb-2">
            <Icon as={X} size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text variant="h3" className="text-foreground text-center">Get Started with QueueLess</Text>
          <Text variant="p" className="text-center">Join the virtual queue from anywhere on campus.</Text>
        </View>
        <View className="gap-3 mt-6">
          <Button size="lg" className="w-full" onPress={() => { setShowSheet(false); router.push('/(auth)/onboarding'); }}>
            <Icon as={UserPlus} size={20} color="#FFFFFF" />
            <Text>Create Account</Text>
          </Button>
          <Button size="lg" variant="outline" className="w-full" onPress={() => { setShowSheet(false); router.push('/(auth)/login'); }}>
            <Icon as={LogIn} size={20} color="#1A1A2E" />
            <Text className="text-foreground">Sign In</Text>
          </Button>
        </View>
        <Text variant="muted" className="text-center mt-6">By continuing, you agree to our Terms of Service.</Text>
      </BottomSheet>
    </View>
  );
}
