import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES } from '@/constants/theme';
import { ClipboardList, Clock, Bell, CheckCircle2 } from 'lucide-react-native';

type ProgressStep = 'joined' | 'in_line' | 'almost' | 'served';

interface QueueProgressTrackerProps {
  currentStep: ProgressStep;
}

const STEPS = [
  { key: 'joined', label: 'Joined', Icon: ClipboardList },
  { key: 'in_line', label: 'In Line', Icon: Clock },
  { key: 'almost', label: 'Almost', Icon: Bell },
  { key: 'served', label: 'Served', Icon: CheckCircle2 },
] as const;

export function QueueProgressTracker({ currentStep }: QueueProgressTrackerProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <View key={step.key} style={styles.step}>
            <View style={[styles.dot, isCompleted && styles.dotActive, isCurrent && styles.dotCurrent]}>
              <step.Icon size={16} color={isCompleted ? COLORS.white : COLORS.textMuted} strokeWidth={2} />
            </View>
            <Text style={[styles.label, isCompleted && styles.labelActive]}>
              {step.label}
            </Text>
            {index < STEPS.length - 1 && (
              <View style={[styles.line, isCompleted && styles.lineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.lg,
  },
  step: { alignItems: 'center', flex: 1 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  dotActive: { backgroundColor: COLORS.primary },
  dotCurrent: { backgroundColor: COLORS.primary },
  label: {
    fontFamily: FONTS.bodySmall, fontSize: FONT_SIZES.caption,
    color: COLORS.textMuted, textAlign: 'center',
  },
  labelActive: { color: COLORS.primary, fontWeight: '600' },
  line: {
    position: 'absolute', top: 18, left: '60%', right: '-40%',
    height: 2, backgroundColor: COLORS.bgTertiary,
  },
  lineActive: { backgroundColor: COLORS.primary },
});
