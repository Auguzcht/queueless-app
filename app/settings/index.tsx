import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
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
    { icon: HelpCircle, label: 'Help & Support', route: '/settings/help' },
    { icon: Info, label: 'About', route: '/settings/about' },
  ]},
];

export default function SettingsScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Settings',
        headerBackVisible: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerBackTitleVisible: false,
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Settings</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
