import { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { queueService } from '@/services/queue.service';
import type { QueueTicket } from '@/schemas/queue.schema';
import { ChevronLeft, Clock } from 'lucide-react-native';

export default function QueueHistoryScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);

  useEffect(() => {
    if (userId) queueService.getQueueHistory(userId).then((r) => setTickets(r.data));
  }, [userId]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Queue History',
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

      <FlatList
        data={tickets}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <QueueTicketCard ticket={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon as={Clock} size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySub}>Your past tickets will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
