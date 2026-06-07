import { useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { QueueNumberDisplay } from '@/components/queue/QueueNumberDisplay';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import { QueuePositionCard } from '@/components/queue/QueuePositionCard';
import { QueueProgressTracker } from '@/components/queue/QueueProgressTracker';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { router } from 'expo-router';

export default function MyQueueScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { activeTickets, isLoading, fetchActiveTickets, cancelTicket } = useQueueStore();

  useEffect(() => { if (userId) fetchActiveTickets(userId); }, [userId]);

  const ticket = activeTickets.find((t) => t.status === 'waiting' || t.status === 'serving');

  if (!ticket) {
    return (
      <SafeAreaView className="flex-1 bg-secondary">
        <Text variant="h2" className="text-foreground px-6 pt-4">My Queue</Text>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg font-semibold text-foreground text-center mb-1">No active queue</Text>
          <Text variant="muted" className="text-center mb-6">Tap Services to join a queue</Text>
          <Button onPress={() => router.push('/services')}><Text>Browse Services</Text></Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6" refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => userId && fetchActiveTickets(userId)} />}>
        <Text variant="h2" className="text-foreground mb-6">My Queue</Text>
        <View className="bg-card rounded-2xl p-6 gap-6 shadow-sm border border-border">
          <View className="items-center gap-2">
            <QueueNumberDisplay ticketNumber={ticket.ticket_number} large />
            <QueueStatusBadge status={ticket.status} />
          </View>
          <QueuePositionCard position={ticket.position} totalAhead={Math.max(ticket.position - 1, 0)} />
          <QueueProgressTracker currentStep={ticket.status === 'serving' ? 'served' : 'in_line'} />
          {ticket.status === 'waiting' && (
            <Button variant="destructive" onPress={() => cancelTicket(ticket.id)}><Text>Cancel Ticket</Text></Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

