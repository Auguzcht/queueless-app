import { useEffect } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { formatRelativeTime } from '@/utils/format';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (userId) fetchNotifications(userId);
  }, [userId]);

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      {/* Header */}
      <SafeAreaView className="bg-[#F8F9FA]" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 pb-3 pt-2">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <Icon as={ChevronLeft} size={20} color="#1A1A2E" />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold font-display">Notifications</Text>
          </View>
          {unread.length > 0 && (
            <TouchableOpacity onPress={() => userId && markAllAsRead(userId)} activeOpacity={0.7}>
              <Text className="text-[#004E98] text-sm font-semibold">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

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
