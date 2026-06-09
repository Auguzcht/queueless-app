import { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, View, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ActivityIndicator, View as RNView } from 'react-native';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { waittimeService } from '@/services/waittime.service';
import { departmentService } from '@/services/department.service';
import { useDebounce } from '@/hooks/useDebounce';
import { router } from 'expo-router';
import { Search, GraduationCap, FileText, Landmark, Award, HelpCircle, ChevronRight, Users, Clock, AlertTriangle, X } from 'lucide-react-native';

const ICON_MAP: Record<string, any> = {
  'graduation-cap': GraduationCap,
  'file-text': FileText,
  landmark: Landmark,
  'dollar-sign': Award,
  'help-circle': HelpCircle,
};

export default function ServicesScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { departments, fetchDepartments, getDepartmentStatus } = useDepartmentStore();
  const { activeTickets, joinQueue, isLoading: joining } = useQueueStore();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [statusMap, setStatusMap] = useState<Record<string, { waitingCount: number; nowServing: string | null }>>({});
  const [waitMap, setWaitMap] = useState<Record<string, any>>({});
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptStatus, setDeptStatus] = useState<any>(null);
  const [wait, setWait] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [joiningDept, setJoiningDept] = useState(false);

  // Refresh statuses every time the tab gains focus
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      departments.forEach(async (d) => {
        const s = await getDepartmentStatus(d.id);
        setStatusMap((p) => ({ ...p, [d.id]: s }));
        waittimeService.estimateWait(d.id).then((w) => {
          setWaitMap((p) => ({ ...p, [d.id]: w }));
        }).catch(() => {});
      });
    }, [departments])
  );

  const selectedDepartment = departments.find((d) => d.code === selectedDept);
  const existingTicket = selectedDepartment
    ? activeTickets.find((t) => t.department_id === selectedDepartment.id && (t.status === 'waiting' || t.status === 'serving'))
    : null;

  const openSheet = useCallback(async (code: string) => {
    setSelectedDept(code);
    setTicket(null);
    const dept = departments.find((d) => d.code === code);
    if (dept) {
      // Use cached values immediately
      setWait(waitMap[dept.id] || null);
      setDeptStatus(statusMap[dept.id] || null);
      // Refresh in background
      waittimeService.estimateWait(dept.id).then((w) => {
        setWait(w);
        setWaitMap((p) => ({ ...p, [dept.id]: w }));
      }).catch(() => {});
      departmentService.getDepartmentStatus(dept.id).then((s) => {
        setDeptStatus(s);
        setStatusMap((p) => ({ ...p, [dept.id]: s }));
      }).catch(() => {});
    }
  }, [departments, waitMap, statusMap]);

  const handleJoinQueue = async () => {
    if (!selectedDepartment) return;
    setJoiningDept(true);
    try {
      const t = await joinQueue(selectedDepartment.id);
      setTicket(t);
      // Refresh department status after joining
      if (selectedDepartment) {
        waittimeService.estimateWait(selectedDepartment.id).then(setWait).catch(() => {});
        departmentService.getDepartmentStatus(selectedDepartment.id).then(setDeptStatus).catch(() => {});
      }
    } catch (err: any) {
      console.error('Join queue failed:', JSON.stringify({ message: err?.message, context: err?.context, name: err?.name }));
    }
    setJoiningDept(false);
  };

  const ticketPos = ticket?.position ?? 0;
  const ahead = Math.max(ticketPos - 1, 0);
  const waitMin = wait ? Math.round(((wait.min_minutes ?? 0) + (wait.max_minutes ?? 15)) / 2) : null;

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => {
    departments.forEach(async (d) => {
      const s = await getDepartmentStatus(d.id);
      setStatusMap((p) => ({ ...p, [d.id]: s }));
    });
  }, [departments]);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(debounced.toLowerCase()) ||
    d.code.toLowerCase().includes(debounced.toLowerCase()),
  );

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dynamic Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 20 }}>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle}>Join a queue or check live status</Text>
        </View>

        <View style={styles.searchRow}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search departments..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            cursorColor="#004E98"
          />
        </View>

        {filtered.map((d) => {
          const status = statusMap[d.id] ?? { waitingCount: 0, nowServing: null };
          const DeptIcon = ICON_MAP[d.icon ?? ''] ?? HelpCircle;
          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => openSheet(d.code)}
              activeOpacity={0.7}
              style={styles.card}
            >
              <View style={styles.cardInner}>
                <View style={[styles.iconBox, { backgroundColor: (d.color ?? '#004E98') + '15' }]}>
                  <Icon as={DeptIcon} size={22} color={d.color ?? '#004E98'} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{d.name}</Text>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{d.code}</Text>
                    </View>
                  </View>
                  {status && (
                    <View style={styles.statusRow}>
                      <View style={styles.statusItem}>
                        <Users size={13} color="#6B7280" />
                        <Text style={styles.statusLabel}>{status.waitingCount} waiting</Text>
                      </View>
                      {status.nowServing && (
                        <View style={styles.statusItem}>
                          <Clock size={13} color="#FF6700" />
                          <Text style={[styles.statusLabel, { color: '#FF6700', fontWeight: '600' }]}>{status.nowServing}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <ChevronRight size={18} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No departments found</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>

      {/* Join Queue Bottom Sheet */}
      <BottomSheet visible={!!selectedDept} onClose={() => { setSelectedDept(null); setTicket(null); }}>
        <RNView style={{ maxHeight: Dimensions.get('window').height * 0.8 }}>
          <RNView style={{ alignItems: 'flex-end', marginBottom: 4 }}>
            <Button variant="ghost" onPress={() => { setSelectedDept(null); setTicket(null); }} style={{ padding: 4, minWidth: 0 }}>
              <Icon as={X} size={22} color="#9CA3AF" />
            </Button>
          </RNView>

          <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {existingTicket && !ticket ? (
              <RNView style={{ gap: 20 }}>
                <RNView style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 48, fontWeight: '800', color: '#004E98', fontFamily: 'PlusJakartaSans-ExtraBold', lineHeight: 56, paddingTop: 4, includeFontPadding: false }}>
                    {selectedDepartment?.prefix ?? selectedDept}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' }}>
                    {selectedDepartment?.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular', textAlign: 'center' }}>
                    You already have an active ticket here
                  </Text>
                </RNView>

                <RNView style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#22C55E', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <RNView style={{ backgroundColor: '#004E98', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, fontFamily: 'PlusJakartaSans-Bold' }}>{existingTicket.ticket_number}</Text>
                  </RNView>
                  <RNView style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>Active ticket</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', fontFamily: 'Inter-Medium' }}>Position {existingTicket.position}</Text>
                  </RNView>
                </RNView>

                <Button onPress={() => { setSelectedDept(null); router.push('/(tabs)/my-queue'); }} size="lg">
                  <Text>View My Queue</Text>
                </Button>
              </RNView>
            ) : !ticket ? (
              <RNView style={{ gap: 20 }}>
                <RNView style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 48, fontWeight: '800', color: '#004E98', fontFamily: 'PlusJakartaSans-ExtraBold', lineHeight: 56, paddingTop: 4, includeFontPadding: false }}>
                    {selectedDepartment?.prefix ?? selectedDept}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' }}>
                    {selectedDepartment?.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular', textAlign: 'center' }}>
                    {selectedDepartment?.description}
                  </Text>
                </RNView>

                {wait && (
                  <RNView style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                    <RNView style={{ alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, minWidth: 120 }}>
                      <RNView style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                        <Icon as={Clock} size={20} color="#004E98" />
                      </RNView>
                      <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium' }}>Est. Wait</Text>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold', marginTop: 2 }}>{wait.display}</Text>
                    </RNView>
                    <RNView style={{ alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, minWidth: 120 }}>
                      <RNView style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                        <Icon as={Users} size={20} color="#FF6700" />
                      </RNView>
                      <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium' }}>Ahead</Text>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold', marginTop: 2 }}>{wait.people_ahead} waiting</Text>
                    </RNView>
                  </RNView>
                )}

                <Button onPress={handleJoinQueue} disabled={joiningDept || joining} size="lg">
                  {joiningDept ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text>Get in Queue</Text>}
                </Button>
              </RNView>
            ) : (
              <RNView style={{ gap: 20 }}>
                <RNView style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter-Medium' }}>Your Queue Number</Text>
                  <Text style={{ fontSize: 48, fontWeight: '800', color: '#004E98', fontFamily: 'PlusJakartaSans-ExtraBold', letterSpacing: 2, lineHeight: 56, paddingTop: 4, includeFontPadding: false }}>{ticket.ticket_number}</Text>
                  <RNView style={{ backgroundColor: '#DCFCE7', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#16A34A' }}>Active</Text>
                  </RNView>
                </RNView>

                <RNView style={{ flexDirection: 'row', gap: 12 }}>
                  <RNView style={{ alignItems: 'center', flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium', marginBottom: 4 }}>Currently Serving</Text>
                    <Text style={{ fontSize: 24, lineHeight: 32, paddingTop: 4, includeFontPadding: false, fontWeight: '700', color: '#FF6700', fontFamily: 'PlusJakartaSans-Bold' }}>
                      {deptStatus?.nowServing ?? selectedDepartment?.prefix + '—'}
                    </Text>
                  </RNView>
                  <RNView style={{ alignItems: 'center', flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium', marginBottom: 4 }}>Your Position</Text>
                    <Text style={{ fontSize: 24, lineHeight: 32, paddingTop: 4, includeFontPadding: false, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' }}>
                      {ahead > 0 ? `${ahead}${ahead === 1 ? 'st' : ahead === 2 ? 'nd' : ahead === 3 ? 'rd' : 'th'}` : 'Next'}
                    </Text>
                  </RNView>
                </RNView>

                {waitMin && (
                  <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <Icon as={Clock} size={16} color="#6B7280" />
                    <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular' }}>Estimated Wait: ~{waitMin} mins</Text>
                  </RNView>
                )}

                <RNView style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                  <RNView style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <Icon as={AlertTriangle} size={18} color="#F59E0B" style={{ marginTop: 1 }} />
                    <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18, fontFamily: 'Inter-Regular', flex: 1 }}>
                      <Text style={{ fontWeight: '600' }}>Important Reminder</Text>
                      {'\n'}Please be ready within 5 minutes when your number is called.
                    </Text>
                  </RNView>
                </RNView>

                <Button onPress={() => { setSelectedDept(null); setTicket(null); router.push('/(tabs)/my-queue'); }} size="lg">
                  <Text>View My Queue</Text>
                </Button>
              </RNView>
            )}
          </ScrollView>
        </RNView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 6,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
    paddingTop: 4,
    includeFontPadding: false,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 14,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 10,
    fontFamily: 'Inter-Regular',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  codeBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  codeText: {
    fontSize: 11,
    lineHeight: 16,
    includeFontPadding: false,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
