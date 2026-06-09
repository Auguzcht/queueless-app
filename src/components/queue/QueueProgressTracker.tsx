import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDelay, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ClipboardList, Clock, PhoneCall, CheckCircle2 } from 'lucide-react-native';

type Step = 'joined' | 'in_line' | 'called' | 'completed';
const STEPS: { key: Step; label: string; icon: any }[] = [
  { key: 'joined', label: 'Joined', icon: ClipboardList },
  { key: 'in_line', label: 'In Line', icon: Clock },
  { key: 'called', label: 'Called', icon: PhoneCall },
  { key: 'completed', label: 'Done', icon: CheckCircle2 },
];

function StepLine({ done, delay }: { done: boolean; delay: number }) {
  const progress = useSharedValue(done ? 1 : 0);
  useEffect(() => { progress.value = withDelay(delay, withTiming(done ? 1 : 0, { duration: 500, easing: Easing.out(Easing.cubic) })); }, [done]);
  const lineStyle = useAnimatedStyle(() => ({ backgroundColor: progress.value > 0 ? `rgba(0, 78, 152, ${progress.value})` : '#E5E7EB' }));
  return (
    <View style={{ position: 'absolute', top: 17, left: '60%', right: '-40%', height: 3, borderRadius: 2, backgroundColor: '#E5E7EB' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 2 }, lineStyle]} />
    </View>
  );
}

function StepDot({ done, icon: IconComp, label, isLast, delay }: { done: boolean; icon: any; label: string; isLast: boolean; delay: number }) {
  const scale = useSharedValue(0.3);
  useEffect(() => { scale.value = done ? withDelay(delay, withSpring(1, { damping: 10, stiffness: 150 })) : withSpring(1, { damping: 10, stiffness: 150 }); }, [done]);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeIn.duration(300).delay(delay)} style={{ alignItems: 'center', flex: 1 }}>
      <Animated.View style={[dotStyle, { width: 36, height: 36, borderRadius: 18, backgroundColor: done ? '#004E98' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }]}>
        <Icon as={IconComp} size={15} color={done ? '#FFFFFF' : '#9CA3AF'} />
      </Animated.View>
      <Text style={{ fontSize: 11, textAlign: 'center', color: done ? '#004E98' : '#9CA3AF', fontWeight: done ? '600' : '400', fontFamily: 'Inter-Medium' }}>{label}</Text>
      {!isLast && <StepLine done={done} delay={delay + 200} />}
    </Animated.View>
  );
}

export function QueueProgressTracker({ currentStep }: { currentStep: Step }) {
  const idx = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 }}>
      {STEPS.map((s, i) => (
        <StepDot key={s.key} done={i <= idx} icon={s.icon} label={s.label} isLast={i === STEPS.length - 1} delay={i * 120} />
      ))}
    </View>
  );
}
