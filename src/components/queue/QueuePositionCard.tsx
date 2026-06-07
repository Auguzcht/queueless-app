import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export function QueuePositionCard({ position, totalAhead }: { position: number; totalAhead: number }) {
  return (
    <View className="border-l-4 border-l-primary bg-card rounded-xl p-4">
      <Text variant="small" className="text-muted-foreground mb-1">Your Position</Text>
      <Text variant="h2" className="text-primary font-display">#{position}</Text>
      <Text variant="default" className="text-muted-foreground">
        {totalAhead === 0 ? "You're next!" : `${totalAhead} people ahead of you`}
      </Text>
    </View>
  );
}
