import { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LiveBoardItem } from '@/components/queue/LiveBoardItem';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { supabase } from '@/lib/supabase';

export default function AdminDepartmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const departments = useDepartmentStore((s) => s.departments);
  const { liveBoard, fetchLiveBoard, subscribeToDepartment } = useQueueStore();
  const department = departments.find((d) => d.id === id);
  const board = id ? liveBoard[id] ?? [] : [];
  const nowServing = board.find((t) => t.status === 'serving');
  const waiting = board.filter((t) => t.status === 'waiting');

  useEffect(() => {
    if (id) { fetchLiveBoard(id); const unsub = subscribeToDepartment(id); return unsub; }
  }, [id]);

  const handleAdvance = async () => {
    if (!id) return;
    const { data: counters } = await supabase.from('counters').select('id').eq('department_id', id).eq('is_active', true).limit(1);
    if (!counters?.length) return;
    try { await supabase.functions.invoke('advance-queue', { body: { department_id: id, counter_id: counters[0].id } }); } catch {}
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <View className="bg-card px-6 pt-4 pb-4 border-b border-border">
        <Text variant="h2" className="text-foreground">{department?.name ?? 'Department'}</Text>
        <Text variant="small" className="text-muted-foreground">{waiting.length} waiting · {nowServing ? `Serving ${nowServing.ticket_number}` : 'No one serving'}</Text>
      </View>
      {nowServing && <View className="bg-accent py-4 items-center"><Text variant="small" className="text-white text-[10px] tracking-widest mb-1">NOW SERVING</Text><Text className="text-white font-display text-4xl">{nowServing.ticket_number}</Text></View>}
      <View className="px-4 py-3"><Button onPress={handleAdvance} className="w-full"><Text>Next</Text></Button></View>
      <FlatList data={waiting} keyExtractor={(i) => i.id} renderItem={({ item, index }) => <LiveBoardItem ticket={item} isCurrentServing={index === 0} />}
        ListEmptyComponent={<View className="items-center py-12"><Text className="text-foreground text-center mb-1">Queue is empty</Text><Text variant="muted" className="text-center">No one is waiting in this department</Text></View>}
      />
    </SafeAreaView>
  );
}
