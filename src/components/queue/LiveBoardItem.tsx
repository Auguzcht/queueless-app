import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import type { QueueTicket } from '@/schemas/queue.schema';

export function LiveBoardItem({ ticket, isCurrentServing }: { ticket: QueueTicket; isCurrentServing?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-3 px-4 ${isCurrentServing ? 'bg-orange-50 rounded-lg my-1' : 'border-b border-border'}`}>
      <Text variant="h4" className={isCurrentServing ? 'text-accent' : 'text-foreground'}>{ticket.ticket_number}</Text>
      <View className="flex-row items-center gap-2">
        <QueueStatusBadge status={ticket.status} />
        {isCurrentServing && <View className="bg-accent px-1.5 py-0.5 rounded"><Text variant="small" className="text-white text-[9px] font-bold tracking-wider">NOW SERVING</Text></View>}
      </View>
    </View>
  );
}
