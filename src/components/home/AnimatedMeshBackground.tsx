import { useEffect, useMemo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Canvas, Circle, Group, Blur, Points } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: SCREEN_H } = Dimensions.get('window');

/**
 * Full-screen gradient mesh + white film grain.
 * Container extends 2x screen height so pull-down always reveals gradient,
 * never a hard edge. Circle targets center around the visible viewport.
 */
export function AnimatedMeshBackground() {
  // Canvas starts at top: -SCREEN_H. Add SCREEN_H to cy positions
  // so circles land in the visible viewport (screen y 0..SCREEN_H).
  const VIS = SCREEN_H;
  // Brand primary blue — bottom anchor, large
  const c1x = useSharedValue(W * 0.45);  const c1y = useSharedValue(VIS + SCREEN_H * 1.1);
  // Brand primary light — upper-right drift
  const c2x = useSharedValue(W * 0.8);   const c2y = useSharedValue(VIS + SCREEN_H * 0.1);
  // Soft purple (complements blue) — top-left fill
  const c3x = useSharedValue(-W * 0.05); const c3y = useSharedValue(VIS + SCREEN_H * -0.05);
  // Rich blue accent — mid scattered
  const c4x = useSharedValue(W * 0.3);   const c4y = useSharedValue(VIS + SCREEN_H * 0.5);
  // Warm peach — subtle top hint (only warmth)
  const c5x = useSharedValue(W * 0.65);  const c5y = useSharedValue(VIS + SCREEN_H * 0.03);

  useEffect(() => {
    const o = (ms: number) => ({ duration: ms, easing: Easing.inOut(Easing.sin) as any });
    c1x.value = withRepeat(withTiming(W * 0.55, o(11000)), -1, true);
    c1y.value = withRepeat(withTiming(VIS + SCREEN_H * 1.0, o(13000)), -1, true);
    c2x.value = withRepeat(withTiming(W * 0.7, o(9000)), -1, true);
    c2y.value = withRepeat(withTiming(VIS + SCREEN_H * 0.3, o(10500)), -1, true);
    c3x.value = withRepeat(withTiming(W * 0.12, o(12000)), -1, true);
    c3y.value = withRepeat(withTiming(VIS + SCREEN_H * 0.08, o(9500)), -1, true);
    c4x.value = withRepeat(withTiming(W * 0.48, o(8500)), -1, true);
    c4y.value = withRepeat(withTiming(VIS + SCREEN_H * 0.42, o(11500)), -1, true);
    c5x.value = withRepeat(withTiming(W * 0.5, o(10000)), -1, true);
    c5y.value = withRepeat(withTiming(VIS + SCREEN_H * 0.06, o(8000)), -1, true);
  }, []);

  // Grain spread across full 2x canvas
  const pts = useMemo(() => {
    const rng = mulberry32(42);
    const n = 8000;
    const arr = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      arr[i * 2] = rng() * W;
      arr[i * 2 + 1] = rng() * SCREEN_H * 2 - SCREEN_H; // -SCREEN_H .. SCREEN_H
    }
    return arr;
  }, []);

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FDF2E9' }]} />
      <Canvas style={styles.canvas}>
        <Group>
          <Blur blur={100} />
          {/* Brand primary blue — dominant bottom anchor */}
          <Circle cx={c1x} cy={c1y} r={W * 0.65} color="#004E98" />
          {/* Brand primary light — upper-right */}
          <Circle cx={c2x} cy={c2y} r={W * 0.7} color="#3A6EA5" />
          {/* Soft purple (complement) — top-left fill */}
          <Circle cx={c3x} cy={c3y} r={W * 0.8} color="#a78bfa" />
          {/* Rich blue accent — mid */}
          <Circle cx={c4x} cy={c4y} r={W * 0.6} color="#1d4ed8" />
          {/* Warm peach — subtle accent only */}
          <Circle cx={c5x} cy={c5y} r={W * 0.4} color="#fb923c" />
        </Group>
        <Points
          points={pts} mode="points" color="rgba(255,255,255,0.03)"
          style="stroke" strokeWidth={1.5}
        />
      </Canvas>
    </View>
  );
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -SCREEN_H,
    left: 0,
    right: 0,
    height: SCREEN_H * 2,
    overflow: 'hidden',
  },
  canvas: { flex: 1 },
});
