import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '@/schemas/queue.schema';

const MAP: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  waiting: 'secondary', serving: 'default', completed: 'outline', skipped: 'outline', cancelled: 'destructive', expired: 'outline',
};

const LABEL: Record<string, string> = {
  waiting: 'Waiting', serving: 'Serving', completed: 'Completed', skipped: 'Skipped', cancelled: 'Cancelled', expired: 'Expired',
};

export function QueueStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={MAP[status] ?? 'secondary'}>{LABEL[status] ?? status}</Badge>;
}
