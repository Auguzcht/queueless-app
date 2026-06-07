import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface StatsRowProps { active: number; completed: number; cancelled: number }

export function StatsRow({ active, completed, cancelled }: StatsRowProps) {
  return (
    <View className="flex-row bg-card rounded-xl p-4 mx-6 -mt-5 shadow-sm border border-border">
      <Stat value={active} label="Active" color="#004E98" />
      <View className="w-px bg-border" />
      <Stat value={completed} label="Completed" color="#22C55E" />
      <View className="w-px bg-border" />
      <Stat value={cancelled} label="Cancelled" color="#EF4444" />
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="flex-1 items-center">
      <Text variant="h2" className="font-extrabold" style={{ color }}>{value}</Text>
      <Text variant="small" className="text-muted-foreground">{label}</Text>
    </View>
  );
}
