import React, { createContext, useContext, useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing as RNEasing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

interface MeshState {
  x1: { value: number };
  y1: { value: number };
  x2: { value: number };
  y2: { value: number };
  x3: { value: number };
  y3: { value: number };
  x4: { value: number };
  y4: { value: number };
  x5: { value: number };
  y5: { value: number };
}

const MeshContext = createContext<MeshState | null>(null);

export function MeshProvider({ children }: { children: React.ReactNode }) {
  // Shared values at top level — required by hooks rules
  const x1 = useSharedValue(W * 0.2);
  const y1 = useSharedValue(H * 0.1);
  const x2 = useSharedValue(W * 0.8);
  const y2 = useSharedValue(H * 0.3);
  const x3 = useSharedValue(W * 0.5);
  const y3 = useSharedValue(H * 0.8);
  const x4 = useSharedValue(W * 0.1);
  const y4 = useSharedValue(H * 0.6);
  const x5 = useSharedValue(W * 0.6);
  const y5 = useSharedValue(H * 0.4);

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

  return (
    <MeshContext.Provider value={{ x1, y1, x2, y2, x3, y3, x4, y4, x5, y5 }}>
      {children}
    </MeshContext.Provider>
  );
}

export function useMesh() {
  const ctx = useContext(MeshContext);
  if (!ctx) throw new Error('useMesh must be used within MeshProvider');
  return ctx;
}
