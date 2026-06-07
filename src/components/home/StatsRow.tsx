import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, RADIUS, SHADOWS } from '@/constants/theme';

interface StatsRowProps {
  active: number;
  completed: number;
  cancelled: number;
}

export function StatsRow({ active, completed, cancelled }: StatsRowProps) {
  return (
    <View style={styles.container}>
      <StatItem value={active} label="Active" color={COLORS.primary} />
      <View style={styles.divider} />
      <StatItem value={completed} label="Completed" color={COLORS.success} />
      <View style={styles.divider} />
      <StatItem value={cancelled} label="Cancelled" color={COLORS.error} />
    </View>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    marginTop: -SPACING.xl,
    ...SHADOWS.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.h1,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  label: {
    fontFamily: FONTS.bodySmall,
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
});
