import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';

export function pwScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (/[A-Z]/.test(pw)) s += 25;
  if (/[0-9]/.test(pw)) s += 25;
  if (/[^A-Za-z0-9]/.test(pw)) s += 25;
  return s;
}

function pwColor(pw: string): string {
  const s = pwScore(pw);
  if (s < 50) return '#EF4444';
  if (s < 75) return '#F59E0B';
  return '#22C55E';
}

function pwLabel(pw: string): string {
  const s = pwScore(pw);
  if (s < 25) return 'Very weak';
  if (s < 50) return 'Weak';
  if (s < 75) return 'Fair';
  return 'Strong';
}

export function PasswordStrength({ password }: { password: string }) {
  const score = pwScore(password);
  const color = pwColor(password);
  const label = pwLabel(password);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(score, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color,
  }));

  if (!password) return null;

  return (
    <View style={{ marginTop: 8, gap: 4 }}>
      <View style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 3 }, barStyle]} />
      </View>
      <Text style={{ fontSize: 11, color, fontFamily: 'Inter-Medium' }}>{label}</Text>
    </View>
  );
}
