import { useEffect, useState, useCallback, useRef } from 'react';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { supabase } from '@/lib/supabase';
import { ChevronDown, SkipForward, Users, Clock, XCircle, LogOut, CheckCircle2 } from 'lucide-react-native';

export default function AdminDashboard() {
  const { departments, fetchDepartments } = useDepartmentStore();
  const signOut = useAuthStore((s) => s.signOut);
  const { selectedDeptId: savedDept, selectedCounterId: savedCounter, setStaffSelections } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [selectedDept, setSelectedDept] = useState<string | null>(savedDept);
  const [selectedCounter, setSelectedCounter] = useState<string | null>(savedCounter);
  const [board, setBoard] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const chevronRotate = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withSpring(showDeptPicker ? '180deg' : '0deg', { damping: 15, stiffness: 150 }) }],
  }));
  const [showAddCtr, setShowAddCtr] = useState(false);
  const [newCtrNum, setNewCtrNum] = useState('');

  useEffect(() => { fetchDepartments(); }, []);

  // Auto-select first department
  useEffect(() => {
    if (departments.length > 0 && !selectedDept) { setSelectedDept(departments[0].id); setStaffSelections(departments[0].id, null); }
  }, [departments]);

  const fetchBoard = useCallback(async () => {
    if (!selectedDept) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('queue_tickets')
      .select('*')
      .eq('department_id', selectedDept)
      .eq('date', today)
      .in('status', ['waiting', 'serving'])
      .order('position', { ascending: true });
    console.log('fetchBoard got:', JSON.stringify(data?.map((t:any) => ({ n: t.ticket_number, s: t.status, p: t.position }))));
    if (data) setBoard(data);
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedDept) return;
    setSelectedCounter(null);
    supabase.from('counters').select('*').eq('department_id', selectedDept).eq('is_active', true).then(({ data }) => {
      if (data) { setCounters(data); }
    });
    fetchBoard();
    const channel = supabase
      .channel(`admin-${selectedDept}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets', filter: `department_id=eq.${selectedDept}` }, () => {})
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [selectedDept]);

  const dept = departments.find((d) => d.id === selectedDept);
  const serving = board.find((t) => t.status === 'serving');
  const waiting = board.filter((t) => t.status === 'waiting');
  const nextUp = waiting.slice(0, 8);



  const handleAdvance = async () => {
    if (!selectedDept || !selectedCounter || advancing) return;
    console.log('Advancing:', { dept: selectedDept, counter: selectedCounter });
    setAdvancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('advance-queue', {
        body: { department_id: selectedDept, counter_id: selectedCounter },
      });
      console.log('Advance result:', { data, error: error?.message });
      // Update board directly from response
      if (data) {
        console.log('Advance response data:', { n: data.ticket_number, s: data.status, p: data.position, id: data.id });
        setBoard((prev) => {
          const removed = prev.map(t => ({ n: t.ticket_number, s: t.status, p: t.position }));
          const updated = prev.filter((t) => t.id !== data.id && t.status !== 'serving');
          const result = [...updated, data].sort((a, b) => a.position - b.position);
          console.log('Board update: removed', JSON.stringify(removed), 'result', JSON.stringify(result.map((t:any) => ({ n: t.ticket_number, s: t.status, p: t.position }))));
          return result;
        });
      }

    } catch (err: any) {
      console.error('Advance failed:', err.message);
    }
    setAdvancing(false);
  };

  const addCounter = async () => {
    const n = parseInt(newCtrNum, 10);
    if (isNaN(n) || n < 1 || n > 15) return;
    if (counters.find((c) => c.counter_number === n)) return;
    await supabase.from('counters').insert({ department_id: selectedDept, counter_number: n, label: `Counter ${n}`, is_active: true });
    setNewCtrNum(''); setShowAddCtr(false);
    const { data } = await supabase.from('counters').select('*').eq('department_id', selectedDept).eq('is_active', true).order('counter_number', { ascending: true });
    if (data) setCounters(data);
  };

  const removeCounter = async (cid: string, num: number) => {
    Alert.alert('Remove', `Remove Counter ${num}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('counters').update({ is_active: false }).eq('id', cid);
        if (selectedCounter === cid) setSelectedCounter(counters.find((c) => c.id !== cid)?.id ?? null);
        const { data } = await supabase.from('counters').select('*').eq('department_id', selectedDept).eq('is_active', true).order('counter_number', { ascending: true });
        if (data) setCounters(data);
      }},
    ]);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        title: dept ? `${dept.name}` : 'Staff Dashboard',
        headerRight: () => (
          <TouchableOpacity onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }])} style={{ paddingLeft: 9 }}>
            <Icon as={LogOut} size={20} color="#EF4444" />
          </TouchableOpacity>
        ),
      }} />

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        {/* Department Selector */}
        <TouchableOpacity onPress={() => setShowDeptPicker(!showDeptPicker)} style={styles.deptPicker}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' }}>
            {dept?.name ?? 'Select Department'}
          </Text>
          <Animated.View style={chevronStyle}>
            <Icon as={ChevronDown} size={20} color="#6B7280" />
          </Animated.View>
        </TouchableOpacity>

        {showDeptPicker && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.deptDropdown}>
            {departments.map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => { setSelectedDept(d.id); setSelectedCounter(null); setStaffSelections(d.id, null); setShowDeptPicker(false); }}
                style={[styles.deptOption, selectedDept === d.id && { backgroundColor: '#EEF2FF' }]}
              >
                <Text style={{ fontSize: 15, color: selectedDept === d.id ? '#004E98' : '#111827', fontWeight: selectedDept === d.id ? '600' : '400' }}>
                  {d.name}
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>{d.prefix}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {/* Now Serving */}
        <View style={styles.heroCard}>
          <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            {serving ? 'Now Serving' : 'Queue Status'}
          </Text>
          <Text style={{ fontSize: 56, fontWeight: '800', color: serving ? '#FF6700' : '#9CA3AF', fontFamily: 'PlusJakartaSans-ExtraBold', letterSpacing: 2, lineHeight: 64, paddingTop: 4 }}>
            {serving?.ticket_number ?? '—'}
          </Text>
          {serving && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                Counter {serving.counter_id ? counters.find((c) => c.id === serving.counter_id)?.counter_number ?? '-' : '-'}
              </Text>
              <ElapsedTimer calledAt={serving.called_at} />
            </View>
          )}
        </View>

        {/* Counter Selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>Active Counters</Text>
          <TouchableOpacity onPress={() => setShowAddCtr(!showAddCtr)}>
            <Text style={{ fontSize: 12, color: '#004E98', fontWeight: '600' }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {showAddCtr && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827' }}
              placeholder="Counter # (1-15)" placeholderTextColor="#9CA3AF" keyboardType="number-pad" value={newCtrNum} onChangeText={setNewCtrNum}
            />
            <TouchableOpacity onPress={addCounter} style={{ backgroundColor: '#004E98', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {counters.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => { setSelectedCounter(c.id); setStaffSelections(selectedDept, c.id); }}
              onLongPress={() => removeCounter(c.id, c.counter_number)}
              style={[styles.counterChip, selectedCounter === c.id && styles.counterChipActive]}
            >
              <Text style={[styles.counterChipText, selectedCounter === c.id && styles.counterChipTextActive]}>
                C{c.counter_number}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={{ fontSize: 10, color: '#9CA3AF', width: '100%', marginTop: 2 }}>Long-press to remove</Text>
          {!selectedCounter && counters.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: '#FF6700', fontFamily: 'Inter-Medium' }}>Tap a counter above</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {serving && waiting.length === 0 ? (
            <TouchableOpacity onPress={async () => {
              if (!serving || advancing) return;
              setAdvancing(true);
              try {
                const { error: fe } = await supabase.functions.invoke('advance-queue', {
                  body: { department_id: selectedDept, counter_id: selectedCounter, complete_only: true },
                });
                if (fe) console.error('Complete failed:', fe.message);
                else {
                  setBoard((prev) => prev.filter((t) => t.id !== serving.id));
                }
              } catch (err: any) { console.error('Complete failed:', err.message); }
              setAdvancing(false);
            }} disabled={advancing} style={[styles.callBtn, advancing && { opacity: 0.5 }]}>
              {advancing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon as={CheckCircle2} size={22} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, fontFamily: 'Inter-SemiBold' }}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
          <TouchableOpacity onPress={handleAdvance} disabled={advancing || !selectedCounter || waiting.length === 0} style={[styles.callBtn, (advancing || !selectedCounter || waiting.length === 0) && { opacity: 0.5 }]}>
            {advancing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon as={SkipForward} size={22} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, fontFamily: 'Inter-SemiBold' }}>{selectedCounter ? 'Call Next' : 'Pick Counter'}</Text>
              </>
            )}
          </TouchableOpacity>
          )}
          <TouchableOpacity onPress={async () => {
            if (!selectedDept || !selectedCounter || waiting.length === 0) return;
            console.log('Skipping:', { dept: selectedDept, counter: selectedCounter });
            setAdvancing(true);
            try {
              const { data, error } = await supabase.functions.invoke('advance-queue', {
                body: { department_id: selectedDept, counter_id: selectedCounter, skip: true },
              });
              console.log('Skip result:', { data, error: error?.message });
              if (data) {
                setBoard((prev) => {
                  const updated = prev.filter((t) => t.id !== data.id && t.status !== 'serving');
                  return [...updated, data].sort((a, b) => a.position - b.position);
                });
              }
            } catch (err: any) {
              console.error('Skip failed:', err.message);
            }
            setAdvancing(false);
          }} disabled={advancing || !selectedCounter || waiting.length === 0} style={[styles.skipBtn, (advancing || !selectedCounter || waiting.length === 0) && { opacity: 0.5 }]}>
            <Icon as={XCircle} size={22} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 16, fontFamily: 'Inter-SemiBold' }}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Waiting Count */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Users size={16} color="#6B7280" />
          <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
            {waiting.length} {waiting.length === 1 ? 'person' : 'people'} waiting
          </Text>
        </View>

        {/* Up Next List */}
        <View style={styles.listCard}>
          {nextUp.length > 0 ? nextUp.map((t, i) => (
            <View key={t.id} style={[styles.waitingRow, i === 0 && { backgroundColor: '#FFFBEB' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter-Medium', width: 24 }}>{i + 1}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold' }}>{t.ticket_number}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                {new Date(t.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )) : (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter-Regular' }}>Queue is empty</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ElapsedTimer({ calledAt }: { calledAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!calledAt) return;
    const t = new Date(calledAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - t) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [calledAt]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Clock size={14} color="#6B7280" />
      <Text style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter-Medium' }}>
        {Math.floor(elapsed / 60)}:{elapsed % 60 < 10 ? '0' : ''}{elapsed % 60}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  deptPicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  deptDropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  deptOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  heroCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  counterChip: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  counterChipActive: { borderColor: '#004E98', backgroundColor: '#EEF2FF' },
  counterChipText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter-Medium' },
  counterChipTextActive: { color: '#004E98', fontWeight: '600' },
  callBtn: {
    flex: 2, backgroundColor: '#004E98', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  skipBtn: {
    flex: 1, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  listCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  waitingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12,
  },
});
