import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import { formatRelativeTime } from '@/utils/format';
import type { QueueTicket } from '@/schemas/queue.schema';

export function QueueTicketCard({ ticket }: { ticket: QueueTicket }) {
  return (
    <Card className="mb-2 p-4">
      <View className="flex-row justify-between items-center mb-1">
        <Text variant="h4" className="text-foreground">{ticket.ticket_number}</Text>
        <QueueStatusBadge status={ticket.status} />
      </View>
      <Text variant="small" className="text-muted-foreground">{formatRelativeTime(ticket.joined_at)}</Text>
    </Card>
  );
}
