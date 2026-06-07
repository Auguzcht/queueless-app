import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function GreetingHeader() {
  const profile = useAuthStore((s) => s.profile);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <LinearGradient colors={['#004E98', '#3A6EA5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      className="pt-14 pb-8 px-6">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-white/80 text-sm font-body">{getGreeting()}</Text>
          <Text className="text-white text-2xl font-display">{name}</Text>
        </View>
        <Avatar alt={name}>
          <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
          <AvatarFallback>
            <Text className="text-white font-heading text-lg">{name.slice(0, 2).toUpperCase()}</Text>
          </AvatarFallback>
        </Avatar>
      </View>
    </LinearGradient>
  );
}
