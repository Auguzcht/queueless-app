import { useEffect, useState } from 'react';
import { ScrollView, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { DepartmentCard } from '@/components/queue/DepartmentCard';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { useDebounce } from '@/hooks/useDebounce';
import { router } from 'expo-router';

export default function ServicesScreen() {
  const { departments, fetchDepartments } = useDepartmentStore();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [statusMap, setStatusMap] = useState<Record<string, { waitingCount: number; nowServing: string | null }>>({});

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => {
    departments.forEach(async (d) => {
      const s = await useDepartmentStore.getState().getDepartmentStatus(d.id);
      setStatusMap((p) => ({ ...p, [d.id]: s }));
    });
  }, [departments]);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(debounced.toLowerCase()) || d.code.toLowerCase().includes(debounced.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <View className="bg-card px-6 pt-4 pb-4 border-b border-border">
        <Text variant="h2" className="text-foreground mb-3">Services</Text>
        <TextInput className="bg-secondary rounded-lg px-4 py-3 text-foreground font-body" placeholder="Search departments..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
      </View>
      <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
        {filtered.map((d) => (
          <DepartmentCard key={d.id} dept={d} waitingCount={statusMap[d.id]?.waitingCount} nowServing={statusMap[d.id]?.nowServing ?? undefined} onPress={() => router.push(`/queue/join?dept=${d.code}`)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
