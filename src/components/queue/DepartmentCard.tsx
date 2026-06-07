import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import type { Department } from '@/schemas/department.schema';

export function DepartmentCard({ dept, waitingCount, nowServing, onPress }: {
  dept: Department; waitingCount?: number; nowServing?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="mb-3">
      <Card className="border-l-4 p-4" style={{ borderLeftColor: dept.color ?? '#004E98' }}>
        <View className="flex-row justify-between items-center mb-1">
          <Text variant="h4" className="text-foreground">{dept.name}</Text>
          <Text className="text-muted-foreground font-display text-xl">{dept.prefix}</Text>
        </View>
        <Text variant="small" className="text-muted-foreground mb-3">{dept.description}</Text>
        <View className="flex-row gap-6">
          {waitingCount !== undefined && (
            <View className="items-center"><Text variant="h2" className="text-primary">{waitingCount}</Text><Text variant="small" className="text-muted-foreground">Waiting</Text></View>
          )}
          {nowServing && (
            <View className="items-center"><Text variant="h2" className="text-accent">{nowServing}</Text><Text variant="small" className="text-muted-foreground">Now Serving</Text></View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}
