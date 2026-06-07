import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, RADIUS, SHADOWS } from '@/constants/theme';
import type { Department } from '@/schemas/department.schema';

interface DepartmentCardProps {
  department: Department;
  waitingCount?: number;
  nowServing?: string;
  onPress: () => void;
}

export function DepartmentCard({ department, waitingCount, nowServing, onPress }: DepartmentCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: department.color ?? COLORS.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{department.name}</Text>
          <Text style={styles.prefix}>{department.prefix}</Text>
        </View>
        <Text style={styles.description}>{department.description}</Text>
      </View>

      <View style={styles.stats}>
        {waitingCount !== undefined && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{waitingCount}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
        )}
        {nowServing && (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>{nowServing}</Text>
            <Text style={styles.statLabel}>Now Serving</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  top: {
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontFamily: FONTS.heading2,
    fontSize: FONT_SIZES.h3,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  prefix: {
    fontFamily: FONTS.display,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.heading2,
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontFamily: FONTS.bodySmall,
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
});
