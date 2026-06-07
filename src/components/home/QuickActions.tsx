import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Ticket, ClipboardList, Bell, Eye } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

const ACTIONS = [
  { icon: Ticket, color: '#004E98', label: 'Join Queue', route: '/services' },
  { icon: ClipboardList, color: '#22C55E', label: 'My Tickets', route: '/my-queue' },
  { icon: Bell, color: '#FF6700', label: 'Notifications', route: '/notifications' },
  { icon: Eye, color: '#3A6EA5', label: 'Live Board', route: '/services' },
] as const;

export function QuickActions() {
  return (
    <View className="flex-row flex-wrap gap-3 px-6">
      {ACTIONS.map((a) => (
        <TouchableOpacity key={a.label} onPress={() => router.push(a.route as any)} activeOpacity={0.7}
          className="w-[47%] bg-card rounded-xl p-4 items-center shadow-sm border border-border">
          <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: a.color + '15' }}>
            <Icon as={a.icon} size={24} color={a.color} />
          </View>
          <Text variant="small" className="text-foreground font-medium">{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
