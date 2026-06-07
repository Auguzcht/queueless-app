import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, RADIUS } from '@/constants/theme';

interface QueuePositionCardProps {
  position: number;
  totalAhead: number;
}

export function QueuePositionCard({ position, totalAhead }: QueuePositionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your Position</Text>
      <Text style={styles.position}>#{position}</Text>
      <Text style={styles.ahead}>
        {totalAhead === 0 ? "You're next!" : `${totalAhead} people ahead of you`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  position: {
    fontFamily: FONTS.display,
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  ahead: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
});
