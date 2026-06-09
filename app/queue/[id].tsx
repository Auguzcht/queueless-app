import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { QueueNumberDisplay } from '@/components/queue/QueueNumberDisplay';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import { QueuePositionCard } from '@/components/queue/QueuePositionCard';
import { QueueProgressTracker } from '@/components/queue/QueueProgressTracker';
import { useQueueStore } from '@/stores/useQueueStore';
import { formatTimestamp } from '@/utils/format';

export default function QueueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTickets, cancelTicket } = useQueueStore();
  const [loading, setLoading] = useState(true);
  const ticket = activeTickets.find((t) => t.id === id);

  useEffect(() => { setLoading(false); }, [ticket]);

  if (loading) return (
    <SafeAreaView className="flex-1 bg-secondary p-6 gap-4">
      <Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" />
    </SafeAreaView>
  );

  if (!ticket) return (
    <SafeAreaView className="flex-1 bg-secondary items-center justify-center px-6">
      <Text className="text-destructive text-center mb-4">Ticket not found</Text>
      <Button onPress={() => router.back()}><Text>Go Back</Text></Button>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6 gap-6">
        <Card className="p-6 gap-6">
          <View className="items-center gap-2">
            <QueueNumberDisplay ticketNumber={ticket.ticket_number} large />
            <QueueStatusBadge status={ticket.status} />
          </View>
          <QueuePositionCard position={ticket.position} totalAhead={Math.max(ticket.position - 1, 0)} />
          <QueueProgressTracker currentStep={ticket.status === 'serving' ? 'called' : ticket.status === 'waiting' ? 'in_line' : 'in_line'} />
          <View className="gap-3">
            <Row label="Joined" value={formatTimestamp(ticket.joined_at)} />
            {ticket.called_at && <Row label="Called" value={formatTimestamp(ticket.called_at)} />}
            {ticket.completed_at && <Row label="Completed" value={formatTimestamp(ticket.completed_at)} />}
          </View>
        </Card>
        {ticket.status === 'waiting' && <Button variant="destructive" onPress={() => { cancelTicket(ticket.id); router.back(); }} className="w-full"><Text>Cancel Ticket</Text></Button>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text variant="default" className="text-muted-foreground">{label}</Text>
      <Text variant="default" className="text-foreground">{value}</Text>
    </View>
  );
}
