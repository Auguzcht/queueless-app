import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Clock } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { formatWaitTime } from '@/utils/format';

export function WaitTimeEstimate({ minMinutes, maxMinutes, confidence = 'medium' }: {
  minMinutes: number; maxMinutes: number; confidence?: 'high' | 'medium' | 'low';
}) {
  const label = { high: 'AI estimate', medium: 'Estimate', low: 'Rough estimate' };
  return (
    <View className="flex-row items-center gap-3">
      <Icon as={Clock} size={28} color="#6B7280" />
      <View>
        <Text variant="h4" className="text-foreground">{formatWaitTime(minMinutes)}</Text>
        {minMinutes !== maxMinutes && <Text variant="small" className="text-muted-foreground">Up to {formatWaitTime(maxMinutes)}</Text>}
        <Text variant="small" className="text-muted-foreground">{label[confidence]}</Text>
      </View>
    </View>
  );
}
