import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Users, Clock, SkipForward, XCircle, Plus, Trash2 } from 'lucide-react-native';

export default function AdminDepartmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const departments = useDepartmentStore((s) => s.departments);
  const dept = departments.find((d) => d.id === id);
  const [board, setBoard] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newNum, setNewNum] = useState('');

  const fetchAll = useCallback(async () => {
    if (!id) return;
    const today = new Date().toISOString().slice(0, 10);
    const [tickets, ctrs] = await Promise.all([
      supabase.from('queue_tickets').select('*').eq('department_id', id).eq('date', today).in('status', ['waiting', 'serving']).order('position', { ascending: true }),
      supabase.from('counters').select('*').eq('department_id', id).eq('is_active', true).order('counter_number', { ascending: true }),
    ]);
    if (tickets.data) setBoard(tickets.data);
    if (ctrs.data) { setCounters(ctrs.data); if (ctrs.data.length > 0 && !selectedCounter) setSelectedCounter(ctrs.data[0].id); }
  }, [id]);

  useEffect(() => { fetchAll(); const ch = supabase.channel(`adm-dept-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets', filter: `department_id=eq.${id}` }, () => fetchAll()).subscribe(); return () => ch.unsubscribe(); }, [id]);

  const serving = board.find((t) => t.status === 'serving');
  const waiting = board.filter((t) => t.status === 'waiting');

  const addCounter = async () => {
    const n = parseInt(newNum, 10);
    if (isNaN(n) || n < 1 || n > 15) { Alert.alert('Invalid', 'Counter 1-15'); return; }
    if (counters.find((c) => c.counter_number === n)) { Alert.alert('Exists', `C${n} exists`); return; }
    await supabase.from('counters').insert({ department_id: id, counter_number: n, label: `Counter ${n}`, is_active: true });
    setNewNum(''); setShowAdd(false); fetchAll();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <Stack.Screen options={{ title: dept?.name ?? 'Department' }} />
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={{ fontSize: 12, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Now Serving</Text>
          <Text style={{ fontSize: 48, fontWeight: '800', color: serving ? '#FF6700' : '#9CA3AF', lineHeight: 56, paddingTop: 4 }}>
            {serving?.ticket_number ?? '—'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity onPress={async () => { if (!selectedCounter || advancing) return; setAdvancing(true); try { await supabase.functions.invoke('advance-queue', { body: { department_id: id, counter_id: selectedCounter } }); setTimeout(fetchAll, 500); } catch {} setAdvancing(false); }} disabled={advancing} style={[styles.callBtn, advancing && { opacity: 0.5 }]}>
            {advancing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Icon as={SkipForward} size={20} color="#FFFFFF" /><Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Next</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn}><Icon as={XCircle} size={20} color="#EF4444" /><Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 15 }}>Skip</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '600', fontSize: 15, color: '#111827' }}>Counters</Text>
            <TouchableOpacity onPress={() => setShowAdd(!showAdd)}><Text style={{ fontSize: 13, color: '#004E98', fontWeight: '600' }}>+ Add</Text></TouchableOpacity>
          </View>
          {showAdd && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <TextInput style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 }} placeholder="# 1-15" keyboardType="number-pad" value={newNum} onChangeText={setNewNum} />
              <TouchableOpacity onPress={addCounter} style={{ backgroundColor: '#004E98', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '600' }}>Add</Text></TouchableOpacity>
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {counters.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setSelectedCounter(c.id)} onLongPress={() => { Alert.alert('Remove', `Remove C${c.counter_number}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { await supabase.from('counters').update({ is_active: false }).eq('id', c.id); fetchAll(); } }]); }} style={[styles.chip, selectedCounter === c.id && styles.chipActive]}>
                <Text style={[styles.chipText, selectedCounter === c.id && styles.chipTextActive]}>C{c.counter_number}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Long press to remove</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: 4 }}>
          <Users size={15} color="#6B7280" />
          <Text style={{ fontSize: 14, color: '#6B7280' }}>{waiting.length} waiting</Text>
          {serving && <><Clock size={15} color="#FF6700" /><Text style={{ fontSize: 14, color: '#FF6700', fontWeight: '600' }}>{serving.ticket_number}</Text></>}
        </View>

        <View style={styles.card}>
          {waiting.length > 0 ? waiting.map((t, i) => (
            <View key={t.id} style={[styles.row, i === 0 && { backgroundColor: '#FFFBEB' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 13, color: '#9CA3AF', width: 24 }}>{i + 1}</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{t.ticket_number}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{new Date(t.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          )) : <View style={{ alignItems: 'center', paddingVertical: 20 }}><Text style={{ color: '#9CA3AF' }}>Queue empty</Text></View>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  chip: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { borderColor: '#004E98', backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#004E98', fontWeight: '600' },
  callBtn: { flex: 2, backgroundColor: '#004E98', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  skipBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
});
