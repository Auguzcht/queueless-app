import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';
import { ClipboardList, Bell, User, Shield, HelpCircle, Info, LogOut } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

const MENU = [
  { icon: ClipboardList, label: 'Queue History', route: '/settings/queue-history' },
  { icon: Bell, label: 'Notification Settings', route: '/settings/notification-settings' },
  { icon: User, label: 'Edit Profile', route: '/settings/edit-profile' },
  { icon: Shield, label: 'Privacy & Security', route: '/settings/privacy' },
  { icon: HelpCircle, label: 'Help & Support', route: '/settings' },
  { icon: Info, label: 'About', route: '/settings' },
];

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6">
        <View className="items-center bg-card rounded-2xl py-8 px-6 mb-6 shadow-sm border border-border">
          <Avatar alt={name}>
            <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
            <AvatarFallback><Text className="text-white font-bold text-lg">{name.slice(0, 2).toUpperCase()}</Text></AvatarFallback>
          </Avatar>
          <Text variant="h3" className="text-foreground mt-4">{name}</Text>
          {profile?.role && <View className="bg-primary-light/20 px-3 py-1 rounded-full mt-2"><Text variant="small" className="text-primary-light capitalize">{profile.role}</Text></View>}
        </View>

        <View className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
          {MENU.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity onPress={() => router.push(item.route as any)} activeOpacity={0.7} className="flex-row items-center px-4 py-4">
                <Icon as={item.icon} size={20} color="#6B7280" className="mr-3" />
                <Text className="flex-1 text-foreground">{item.label}</Text>
                <Text className="text-muted-foreground text-xl">›</Text>
              </TouchableOpacity>
              {i < MENU.length - 1 && <Separator className="mx-4" />}
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={async () => { await signOut(); }} className="flex-row items-center justify-center mt-6 py-4">
          <Icon as={LogOut} size={18} color="#EF4444" />
          <Text className="text-destructive font-medium ml-2">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
