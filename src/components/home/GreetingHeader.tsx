import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
}

export function GreetingHeader() {
  const profile = useAuthStore((s) => s.profile);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <LinearGradient colors={['#004E98', '#3A6EA5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="pt-14 pb-8 px-6">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text variant="small" className="text-white/80">{getGreeting()}</Text>
          <Text variant="h2" className="text-white font-display">{name}</Text>
        </View>
        <Avatar alt={name}>
          <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
          <AvatarFallback>
            <Text className="text-white font-bold">{name.slice(0, 2).toUpperCase()}</Text>
          </AvatarFallback>
        </Avatar>
      </View>
    </LinearGradient>
  );
}
