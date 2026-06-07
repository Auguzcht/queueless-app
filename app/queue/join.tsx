import { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WaitTimeEstimate } from '@/components/queue/WaitTimeEstimate';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { getDepartmentByCode } from '@/constants/departments';
import { waittimeService } from '@/services/waittime.service';

export default function JoinQueueScreen() {
  const { dept } = useLocalSearchParams<{ dept: string }>();
  const departments = useDepartmentStore((s) => s.departments);
  const { joinQueue, isLoading } = useQueueStore();
  const department = departments.find((d) => d.code === dept);
  const meta = getDepartmentByCode(dept ?? '');
  const [wait, setWait] = useState<any>(null);

  useEffect(() => { if (department) waittimeService.estimateWait(department.id).then(setWait).catch(() => {}); }, [department]);

  if (!department || !meta) return (
    <SafeAreaView className="flex-1 bg-secondary items-center justify-center px-6">
      <Text className="text-destructive text-center mb-4">Department not found</Text>
      <Button onPress={() => router.back()}><Text>Go Back</Text></Button>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <ScrollView contentContainerClassName="p-6 gap-6">
        <View className="items-center pt-4">
          <Text className="text-primary font-display text-5xl">{meta.prefix}</Text>
          <Text variant="h2" className="text-foreground mt-2">{department.name}</Text>
          <Text variant="muted">{department.description}</Text>
        </View>

        <Card className="p-4 gap-3">
          <Text variant="h4" className="text-foreground">Estimated Wait Time</Text>
          {wait ? <WaitTimeEstimate minMinutes={wait.min_minutes} maxMinutes={wait.max_minutes} confidence={wait.confidence} />
            : <Text className="text-muted-foreground">Calculating...</Text>}
        </Card>

        <Card className="bg-amber-50 border-l-4 border-l-warning p-4">
          <Text className="font-semibold text-foreground mb-1">Important Reminder</Text>
          <Text variant="muted">Once called, proceed to the assigned counter within 5 minutes or your ticket will be skipped.</Text>
        </Card>

        <Button onPress={async () => { try { await joinQueue(department.id); router.replace('/(tabs)/my-queue'); } catch {} }} disabled={isLoading} className="w-full">
          <Text>Get in Queue</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
