import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, withSpring, withSequence, withDelay,
  Easing, FadeIn, FadeInDown, FadeInUp, SlideInUp, SlideInDown,
} from 'react-native-reanimated';

// ── Duration / easing constants ─────────────────────────────
export const DURATION = { screen: 300, card: 200, badge: 250, button: 100 } as const;
export const EASING = {
  outCubic: Easing.out(Easing.cubic),
  outQuad: Easing.out(Easing.quad),
  inOutEase: Easing.inOut(Easing.ease),
};
export const SPRING = { damping: 15, stiffness: 150 } as const;

// ── Re-export named animation presets for use in JSX ────────
export { FadeIn, FadeInDown, FadeInUp, SlideInUp, SlideInDown };

// ── Hook: staggered fade-in for lists ───────────────────────
export function useStaggeredFade(index: number, delayBase = 100) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const d = index * delayBase;
    opacity.value = withDelay(d, withTiming(1, { duration: DURATION.card, easing: EASING.outQuad }));
    translateY.value = withDelay(d, withTiming(0, { duration: DURATION.card, easing: EASING.outQuad }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

// ── Hook: scale-on-press (for buttons / cards) ─────────────
export function useScalePress() {
  const scale = useSharedValue(1);

  const pressIn = () => { scale.value = withSpring(0.97, SPRING); };
  const pressOut = () => { scale.value = withSpring(1, SPRING); };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, pressIn, pressOut };
}
