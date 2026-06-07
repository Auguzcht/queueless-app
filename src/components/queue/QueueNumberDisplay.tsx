import { Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS, FONTS, FONT_SIZES } from '@/constants/theme';

interface QueueNumberDisplayProps {
  ticketNumber: string;
  large?: boolean;
}

export function QueueNumberDisplay({ ticketNumber, large = false }: QueueNumberDisplayProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1, { damping: 15 }) }],
  }));

  return (
    <Animated.Text style={[styles.number, large && styles.large, animatedStyle]}>
      {ticketNumber}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  number: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.queueNumber,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  large: {
    fontSize: 64,
  },
});
