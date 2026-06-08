import { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLORS = ['#004E98', '#FF6700', '#22C55E', '#F59E0B', '#3A6EA5', '#EF4444'];
const PIECES = 45;

function ConfettiPiece({ index }: { index: number }) {
  const x = useSharedValue(Math.random() * SCREEN_WIDTH - 50);
  const y = useSharedValue(-20 - Math.random() * 60);
  const rotation = useSharedValue(Math.random() * 360);
  const opacity = useSharedValue(1);
  const color = COLORS[index % COLORS.length];
  const size = 6 + Math.random() * 8;
  const delay = Math.random() * 800;

  useEffect(() => {
    y.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 150, {
      duration: 2500 + Math.random() * 1500,
      easing: Easing.in(Easing.quad),
    }));
    x.value = withDelay(delay, withTiming(x.value + (Math.random() - 0.5) * 60, {
      duration: 2500 + Math.random() * 1500,
    }));
    rotation.value = withDelay(delay, withRepeat(
      withTiming(rotation.value + 360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 800 + Math.random() * 600,
      }),
      -1, false
    ));
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          borderRadius: 2,
        },
      ]}
    />
  );
}

export function Confetti() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      {Array.from({ length: PIECES }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}
