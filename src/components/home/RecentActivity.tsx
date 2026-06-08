import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import type { QueueTicket } from '@/schemas/queue.schema';

interface Props { tickets: QueueTicket[] }

export function RecentActivity({ tickets }: Props) {
  return (
    <View className="mt-6">
      <Text variant="h4" className="text-foreground mb-4">Recent Activity</Text>
      {tickets.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-foreground text-center mb-1">No recent activity</Text>
          <Text variant="muted" className="text-center">Join a queue to see your history here</Text>
        </View>
      ) : (
        tickets.slice(0, 5).map((t) => <QueueTicketCard key={t.id} ticket={t} />)
      )}
    </View>
  );
}
