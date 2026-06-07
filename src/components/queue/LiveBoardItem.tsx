import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, RADIUS } from '@/constants/theme';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import type { QueueTicket } from '@/schemas/queue.schema';

interface LiveBoardItemProps {
  ticket: QueueTicket;
  isCurrentServing?: boolean;
}

export function LiveBoardItem({ ticket, isCurrentServing = false }: LiveBoardItemProps) {
  return (
    <View style={[styles.item, isCurrentServing && styles.currentServing]}>
      <View style={styles.left}>
        <Text style={[styles.ticketNumber, isCurrentServing && styles.currentText]}>
          {ticket.ticket_number}
        </Text>
      </View>
      <View style={styles.right}>
        <QueueStatusBadge status={ticket.status} />
        {isCurrentServing && (
          <View style={styles.servingIndicator}>
            <Text style={styles.servingText}>NOW SERVING</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentServing: {
    backgroundColor: '#FFF3E0',
    borderRadius: RADIUS.sm,
    borderBottomWidth: 0,
    marginVertical: SPACING.xs,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ticketNumber: {
    fontFamily: FONTS.heading2,
    fontSize: FONT_SIZES.h3,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  currentText: {
    color: COLORS.accent,
  },
  servingIndicator: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  servingText: {
    fontFamily: FONTS.caption,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
});
