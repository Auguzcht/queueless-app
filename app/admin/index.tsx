import { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { router } from 'expo-router';

export default function AdminDashboardScreen() {
  const { departments, fetchDepartments } = useDepartmentStore();
  useEffect(() => { fetchDepartments(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6">
        <Text variant="h2" className="text-foreground">Admin Dashboard</Text>
        <Text variant="muted" className="mb-6">Manage queues for each department</Text>
        {departments.map((d) => (
          <TouchableOpacity key={d.id} onPress={() => router.push(`/admin/department/${d.id}`)} activeOpacity={0.7} className="mb-3">
            <Card className="border-l-4 p-4" style={{ borderLeftColor: d.color ?? '#004E98' }}>
              <View className="flex-row justify-between items-center mb-1">
                <Text variant="h4" className="text-foreground">{d.name}</Text>
                <Text className="text-muted-foreground font-display text-xl">{d.prefix}</Text>
              </View>
              <Text variant="small" className="text-muted-foreground">Tap to manage queue →</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
