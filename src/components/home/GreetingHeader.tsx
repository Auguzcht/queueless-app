import { View } from 'react-native';
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
    <View className="flex-row justify-between items-center px-6 pt-14">
      <View className="flex-1">
        <Text className="text-white/70 font-body text-sm tracking-wide">{getGreeting()}</Text>
        <Text className="text-white font-display text-[28px] leading-[34px] font-bold">{name}</Text>
      </View>
      <Avatar alt={name} className="border-2 border-white/30">
        <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
        <AvatarFallback className="bg-white/20">
          <Text className="text-white font-bold text-lg">{name.slice(0, 2).toUpperCase()}</Text>
        </AvatarFallback>
      </Avatar>
    </View>
  );
}
