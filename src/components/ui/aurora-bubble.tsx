import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  color: string; color2: string;
  align: 'left' | 'right';
  startY: number; w: number; h: number; idx: number;
}

const DURATION = 7000;

export function AuroraBubble({ color, color2, align, startY, w, h, idx }: Props) {
  const offset = useSharedValue(Math.random() * 0.5);
  const opacity = useSharedValue(0.12 + idx * 0.03);

  useEffect(() => {
    offset.value = withRepeat(withSequence(
      withTiming(0.7 + Math.random() * 0.3, { duration: DURATION + idx * 800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: DURATION + idx * 800, easing: Easing.inOut(Easing.sin) })
    ), -1, true);
    opacity.value = withRepeat(withSequence(
      withTiming(0.18 + idx * 0.03, { duration: (DURATION + idx * 600) * 0.6 }),
      withTiming(0.08 + idx * 0.02, { duration: (DURATION + idx * 600) * 0.6 })
    ), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value * (align === 'left' ? 40 : -30) },
      { translateY: offset.value * (idx % 2 === 0 ? -20 : 15) },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          top: `${startY * 100}%`,
          [align]: -w * 0.15,
          width: w,
          height: h,
          borderRadius: Math.max(w, h) / 2,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[color + '50', color2 + '30', 'transparent']}
        start={{ x: align === 'left' ? 0 : 1, y: 0 }}
        end={{ x: align === 'left' ? 1 : 0, y: 1 }}
        style={{ flex: 1, borderRadius: Math.max(w, h) / 2 }}
      />
    </Animated.View>
  );
}
