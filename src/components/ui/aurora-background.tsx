import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuroraBubble } from './aurora-bubble';

const BUBBLES = [
  { colors: [0, 1], align: 'left', startY: 0, w: 480, h: 360 },
  { colors: [2, 0], align: 'right', startY: 0.18, w: 360, h: 280 },
  { colors: [1, 2], align: 'left', startY: 0.42, w: 420, h: 340 },
  { colors: [0, 1], align: 'right', startY: 0.65, w: 380, h: 300 },
];

export function AuroraBackground({ colorStops = ['#004E98', '#3A6EA5', '#FF6700'] }: AuroraProps) {
  return (
    <View className="absolute inset-0 overflow-hidden">
      <LinearGradient colors={['#001222', '#001B3D', '#001222']} locations={[0, 0.5, 1]} className="absolute inset-0" />
      {BUBBLES.map((b, i) => (
        <AuroraBubble
          key={i}
          color={colorStops[b.colors[0]]}
          color2={colorStops[b.colors[1]]}
          align={b.align as 'left' | 'right'}
          startY={b.startY}
          w={b.w}
          h={b.h}
          idx={i}
        />
      ))}
    </View>
  );
}

interface AuroraProps { colorStops?: string[] }
