import { useState } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft } from 'lucide-react-native';

const TOGGLES = [
  {
    key: 'all',
    label: 'All Notifications',
    desc: 'Master switch for all app notifications',
    isMaster: true,
  },
  {
    key: 'queue_updates',
    label: 'Queue Updates',
    desc: 'Get notified when your queue position changes',
  },
  {
    key: 'your_turn',
    label: 'Your Turn Alert',
    desc: 'Alert when you are next in line to be served',
  },
  {
    key: 'announcements',
    label: 'Announcements',
    desc: 'General announcements from your department',
  },
  {
    key: 'reminders',
    label: 'Reminders',
    desc: 'Reminders about upcoming or active queue tickets',
  },
  {
    key: 'tips',
    label: 'Tips & Updates',
    desc: 'App tips, feature updates, and news',
  },
];

export default function NotificationSettingsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    all: true,
    queue_updates: true,
    your_turn: true,
    announcements: false,
    reminders: true,
    tips: false,
  });

  const toggle = (key: string) => {
    if (key === 'all') {
      const next = !toggles.all;
      setToggles(Object.fromEntries(TOGGLES.map((t) => [t.key, next])));
      setEnabled(next);
    } else {
      setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const masterOn = toggles.all;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Notifications',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 5 }}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerBackTitleVisible: false,
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Control which notifications QueueLess can send you. Turn off the master switch to silence everything at once.
        </Text>

        <View style={styles.card}>
          {TOGGLES.map((item, i) => (
            <View key={item.key}>
              <View style={[styles.row, item.isMaster && styles.masterRow]}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, item.isMaster && styles.masterLabel]}>{item.label}</Text>
                  <Text style={[styles.rowDesc, !masterOn && !item.isMaster && styles.disabled]}>{item.desc}</Text>
                </View>
                <Switch
                  value={item.isMaster ? masterOn : (masterOn && toggles[item.key])}
                  onValueChange={() => toggle(item.key)}
                  disabled={!masterOn && !item.isMaster}
                  trackColor={{ false: '#E5E7EB', true: '#004E98' }}
                  thumbColor="#FFFFFF"
                  style={styles.switch}
                />
              </View>
              {i < TOGGLES.length - 1 && <Separator style={styles.sep} />}
            </View>
          ))}
        </View>

        <Text style={styles.systemNote}>
          To completely disable all alerts, manage QueueLess permissions in your device's native system settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  masterRow: {
    backgroundColor: '#F9FAFB',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  masterLabel: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  rowDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  disabled: {
    opacity: 0.5,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  sep: {
    marginLeft: 16,
  },
  systemNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
});
