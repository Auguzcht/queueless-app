import { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing as RNEasing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

export function AnimatedMeshBackground() {
  const x1 = useSharedValue(W * 0.2); const y1 = useSharedValue(H * 0.1);
  const x2 = useSharedValue(W * 0.8); const y2 = useSharedValue(H * 0.3);
  const x3 = useSharedValue(W * 0.5); const y3 = useSharedValue(H * 0.8);
  const x4 = useSharedValue(W * 0.1); const y4 = useSharedValue(H * 0.6);
  const x5 = useSharedValue(W * 0.6); const y5 = useSharedValue(H * 0.4);

  useEffect(() => {
    const c = (d: number) => ({ duration: d, easing: RNEasing.inOut(RNEasing.sin) as any });
    x1.value = withRepeat(withTiming(W * 0.8, c(9000)), -1, true);
    y1.value = withRepeat(withTiming(H * 0.5, c(11000)), -1, true);
    x2.value = withRepeat(withTiming(W * 0.2, c(8000)), -1, true);
    y2.value = withRepeat(withTiming(H * 0.7, c(10000)), -1, true);
    x3.value = withRepeat(withTiming(W * 0.9, c(10000)), -1, true);
    y3.value = withRepeat(withTiming(H * 0.2, c(9000)), -1, true);
    x4.value = withRepeat(withTiming(W * 0.8, c(8500)), -1, true);
    y4.value = withRepeat(withTiming(H * 0.1, c(9500)), -1, true);
    x5.value = withRepeat(withTiming(W * 0.1, c(7000)), -1, true);
    y5.value = withRepeat(withTiming(H * 0.6, c(8000)), -1, true);
  }, []);

  const R = W * 0.85;

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#DCEBFA' }]} />
      <Canvas style={{ width: W, height: H }}>
        <Circle cx={x1} cy={y1} r={R} color="rgba(0, 87, 184, 0.25)" />
        <Circle cx={x2} cy={y2} r={R} color="rgba(47, 128, 237, 0.25)" />
        <Circle cx={x3} cy={y3} r={R} color="rgba(124, 58, 237, 0.2)" />
        <Circle cx={x4} cy={y4} r={R * 0.7} color="rgba(249, 115, 22, 0.15)" />
        <Circle cx={x5} cy={y5} r={R * 0.6} color="rgba(14, 165, 233, 0.2)" />
      </Canvas>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.01)' }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
