import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { router } from 'expo-router';
import { User, ClipboardList, Bell, Shield, HelpCircle, Info } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

const GROUPS = [
  { title: 'Account', items: [
    { icon: User, label: 'Edit Profile', route: '/settings/edit-profile' },
    { icon: ClipboardList, label: 'Queue History', route: '/settings/queue-history' },
  ]},
  { title: 'Preferences', items: [
    { icon: Bell, label: 'Notification Settings', route: '/settings/notification-settings' },
    { icon: Shield, label: 'Privacy & Security', route: '/settings/privacy' },
  ]},
  { title: 'Support', items: [
    { icon: HelpCircle, label: 'Help & Support', route: '/settings' },
    { icon: Info, label: 'About', route: '/settings' },
  ]},
];

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6">
        <Text variant="h2" className="text-foreground mb-6">Settings</Text>
        {GROUPS.map((g) => (
          <View key={g.title} className="mb-6">
            <Text variant="small" className="text-muted-foreground uppercase tracking-wider mb-2 ml-1">{g.title}</Text>
            <View className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
              {g.items.map((item, i) => (
                <View key={item.label}>
                  <TouchableOpacity onPress={() => router.push(item.route as any)} activeOpacity={0.7} className="flex-row items-center px-4 py-4">
                    <Icon as={item.icon} size={20} color="#6B7280" className="mr-3" />
                    <Text className="flex-1 text-foreground">{item.label}</Text>
                    <Text className="text-muted-foreground text-xl">›</Text>
                  </TouchableOpacity>
                  {i < g.items.length - 1 && <Separator className="ml-14" />}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
