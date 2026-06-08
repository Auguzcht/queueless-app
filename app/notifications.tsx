import { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { formatRelativeTime } from '@/utils/format';


export default function NotificationsScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (userId) fetchNotifications(userId);
  }, [userId]);

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Notifications',
        headerBackVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 5 }}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
        ),
        headerRight: () => unread.length > 0 ? (
          <TouchableOpacity onPress={() => userId && markAllAsRead(userId)} activeOpacity={0.7}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : null,
      }} />

      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.is_read && markAsRead(item.id)}
            activeOpacity={0.7}
            className="bg-white rounded-2xl px-4 py-4 mb-2 border border-gray-100"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <View className="flex-row items-start gap-3">
              {/* Unread dot */}
              {!item.is_read && (
                <View className="w-2.5 h-2.5 rounded-full bg-[#004E98] mt-1.5" />
              )}
              {item.is_read && <View className="w-2.5" />}

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="text-foreground font-semibold text-[15px] flex-1">{item.title}</Text>
                  <Text className="text-gray-400 text-[11px] ml-2">{formatRelativeTime(item.created_at)}</Text>
                </View>
                <Text className="text-gray-500 text-sm leading-5">{item.body}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-24">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Icon as={Bell} size={28} color="#9CA3AF" />
            </View>
            <Text className="text-foreground text-lg font-semibold text-center">No notifications</Text>
            <Text className="text-gray-400 text-sm text-center mt-1">You're all caught up!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  markAll: { color: '#004E98', fontSize: 14, fontWeight: '600' },
});
