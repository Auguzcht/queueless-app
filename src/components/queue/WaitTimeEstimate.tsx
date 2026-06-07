import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES } from '@/constants/theme';
import { formatWaitTime } from '@/utils/format';

interface WaitTimeEstimateProps {
  minMinutes: number;
  maxMinutes: number;
  confidence?: 'high' | 'medium' | 'low';
}

export function WaitTimeEstimate({ minMinutes, maxMinutes, confidence = 'medium' }: WaitTimeEstimateProps) {
  const confidenceLabel = { high: 'AI estimate', medium: 'Estimate', low: 'Rough estimate' };

  return (
    <View style={styles.container}>
      <Text style={styles.clock}>⏱</Text>
      <View>
        <Text style={styles.time}>{formatWaitTime(minMinutes)}</Text>
        {minMinutes !== maxMinutes && (
          <Text style={styles.range}>Up to {formatWaitTime(maxMinutes)}</Text>
        )}
        <Text style={styles.confidence}>{confidenceLabel[confidence]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  clock: {
    fontSize: 28,
  },
  time: {
    fontFamily: FONTS.heading2,
    fontSize: FONT_SIZES.h3,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  range: {
    fontFamily: FONTS.bodySmall,
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
  confidence: {
    fontFamily: FONTS.bodySmall,
    fontSize: FONT_SIZES.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
