import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { queueService } from '@/services/queue.service';
import type { QueueTicket } from '@/schemas/queue.schema';

export default function QueueHistoryScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);

  useEffect(() => { if (userId) queueService.getQueueHistory(userId).then((r) => setTickets(r.data)); }, [userId]);

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <FlatList data={tickets} keyExtractor={(i) => i.id} renderItem={({ item }) => <QueueTicketCard ticket={item} />}
        contentContainerClassName="p-6" ListHeaderComponent={<Text variant="h2" className="text-foreground mb-4">Queue History</Text>}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-foreground text-center mb-1">No history yet</Text>
            <Text variant="muted" className="text-center">Your past tickets will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
