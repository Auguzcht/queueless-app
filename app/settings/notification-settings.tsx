import { View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Separator } from '@/components/ui/separator';

const TYPES = [
  { key: 'queue_joined', label: 'Queue Joined', desc: 'When you join a queue' },
  { key: 'your_turn', label: 'Your Turn', desc: 'When you are being served' },
  { key: 'almost_your_turn', label: 'Almost Your Turn', desc: 'When you are next in line' },
  { key: 'system_announcement', label: 'Announcements', desc: 'System-wide announcements' },
];

export default function NotificationSettingsScreen() {
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6">
        <Text variant="h2" className="text-foreground mb-6">Notification Settings</Text>

        <View className="flex-row justify-between items-center bg-card rounded-xl p-4 mb-4 shadow-sm border border-border">
          <View><Text className="text-foreground font-medium">Push Notifications</Text><Text variant="small" className="text-muted-foreground">Master toggle for all notifications</Text></View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#EBEBEB', true: '#3A6EA5' }} thumbColor={notificationsEnabled ? '#004E98' : '#9CA3AF'} />
        </View>

        <View className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
          {TYPES.map((t, i) => (
            <View key={t.key} className={`flex-row justify-between items-center p-4 ${!notificationsEnabled ? 'opacity-50' : ''}`}>
              <View className="flex-1 mr-4">
                <Text className="text-foreground">{t.label}</Text>
                <Text variant="small" className="text-muted-foreground">{t.desc}</Text>
              </View>
              <Switch value={notificationsEnabled} disabled={!notificationsEnabled} onValueChange={() => {}} trackColor={{ false: '#EBEBEB', true: '#3A6EA5' }} thumbColor="#004E98" />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
