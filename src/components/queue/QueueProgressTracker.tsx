import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ClipboardList, Clock, Bell, CheckCircle2 } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

type Step = 'joined' | 'in_line' | 'almost' | 'served';
const STEPS: { key: Step; label: string; icon: any }[] = [
  { key: 'joined', label: 'Joined', icon: ClipboardList },
  { key: 'in_line', label: 'In Line', icon: Clock },
  { key: 'almost', label: 'Almost', icon: Bell },
  { key: 'served', label: 'Served', icon: CheckCircle2 },
];

export function QueueProgressTracker({ currentStep }: { currentStep: Step }) {
  const idx = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <View className="flex-row justify-between items-start py-3">
      {STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <View key={s.key} className="items-center flex-1">
            <View className={`w-9 h-9 rounded-full items-center justify-center mb-2 ${done ? 'bg-primary' : 'bg-muted'}`}>
              <Icon as={s.icon} size={16} color={done ? '#FFFFFF' : '#9CA3AF'} />
            </View>
            <Text variant="small" className={`text-center ${done ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{s.label}</Text>
            {i < STEPS.length - 1 && <View className={`absolute top-[18px] left-[60%] right-[-40%] h-0.5 ${done ? 'bg-primary' : 'bg-muted'}`} />}
          </View>
        );
      })}
    </View>
  );
}
