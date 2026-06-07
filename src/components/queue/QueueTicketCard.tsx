import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, RADIUS, SHADOWS } from '@/constants/theme';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import { formatRelativeTime } from '@/utils/format';
import type { QueueTicket } from '@/schemas/queue.schema';

interface QueueTicketCardProps {
  ticket: QueueTicket;
}

export function QueueTicketCard({ ticket }: QueueTicketCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
        <QueueStatusBadge status={ticket.status} />
      </View>
      <Text style={styles.date}>{formatRelativeTime(ticket.joined_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  ticketNumber: {
    fontFamily: FONTS.heading2,
    fontSize: FONT_SIZES.h3,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  date: {
    fontFamily: FONTS.bodySmall,
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
});
