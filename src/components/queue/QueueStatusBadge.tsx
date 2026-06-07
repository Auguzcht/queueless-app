import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '@/schemas/queue.schema';

const statusToVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  waiting: 'secondary',
  serving: 'default',
  completed: 'outline',
  skipped: 'outline',
  cancelled: 'destructive',
  expired: 'outline',
};

const statusLabel: Record<string, string> = {
  waiting: 'Waiting',
  serving: 'Serving',
  completed: 'Completed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

interface QueueStatusBadgeProps {
  status: TicketStatus;
}

export function QueueStatusBadge({ status }: QueueStatusBadgeProps) {
  return (
    <Badge variant={statusToVariant[status] ?? 'secondary'}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}
