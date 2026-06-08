import { View, Dimensions, StyleSheet } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useMesh } from '@/lib/mesh-context';

const { width: W, height: H } = Dimensions.get('window');
const R = W * 0.85;

/**
 * Renders the animated mesh circles using shared values from MeshProvider.
 * Mount this inside each page that needs the mesh background.
 * Since the shared values are from context, all instances show the same positions.
 */
export function MeshCanvas() {
  const { x1, y1, x2, y2, x3, y3, x4, y4, x5, y5 } = useMesh();

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
