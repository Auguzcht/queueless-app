import { View, Text } from 'react-native';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import type { QueueTicket } from '@/schemas/queue.schema';

interface RecentActivityProps { tickets: QueueTicket[] }

export function RecentActivity({ tickets }: RecentActivityProps) {
  if (tickets.length === 0) {
    return (
      <View className="px-6 mt-6">
        <Text className="text-lg font-heading-semi text-foreground mb-4">Recent Activity</Text>
        <View className="items-center py-8">
          <Text className="text-lg font-heading-semi text-foreground text-center mb-1">No recent activity</Text>
          <Text className="text-sm font-body text-muted-foreground text-center">Join a queue to see your history here</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 mt-6">
      <Text className="text-lg font-heading-semi text-foreground mb-4">Recent Activity</Text>
      {tickets.slice(0, 5).map((ticket) => (
        <QueueTicketCard key={ticket.id} ticket={ticket} />
      ))}
    </View>
  );
}
