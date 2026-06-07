import { useEffect } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { formatRelativeTime } from '@/utils/format';

export default function NotificationsScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => { if (userId) fetchNotifications(userId); }, [userId]);

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <View className="flex-row justify-between items-center bg-card px-6 pt-4 pb-4 border-b border-border">
        <Text variant="h2" className="text-foreground">Notifications</Text>
        {notifications.some((n) => !n.is_read) && (
          <TouchableOpacity onPress={() => userId && markAllAsRead(userId)}><Text variant="small" className="text-primary-light">Mark all as read</Text></TouchableOpacity>
        )}
      </View>
      <FlatList data={notifications} keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => !item.is_read && markAsRead(item.id)} activeOpacity={0.7}
            className={`flex-row bg-card rounded-xl p-4 mx-4 my-1 items-start shadow-sm border border-border ${!item.is_read ? 'border-l-4 border-l-primary' : ''}`}>
            <View className="w-4 pt-1">{!item.is_read && <View className="w-2 h-2 rounded-full bg-primary" />}</View>
            <View className="flex-1 mr-2">
              <Text className="text-foreground font-medium">{item.title}</Text>
              <Text variant="small" className="text-muted-foreground mt-1 leading-4">{item.body}</Text>
              <Text variant="small" className="text-muted-foreground mt-2">{formatRelativeTime(item.created_at)}</Text>
            </View>
            <Badge variant={item.type === 'your_turn' ? 'default' : 'secondary'}>{item.type === 'your_turn' ? 'Now' : 'New'}</Badge>
          </TouchableOpacity>
        )}
        contentContainerClassName="py-4"
        ListEmptyComponent={
          <View className="items-center py-16"><Text className="text-foreground text-lg font-semibold text-center">No notifications</Text><Text variant="muted" className="text-center">You're all caught up!</Text></View>
        }
      />
    </SafeAreaView>
  );
}
