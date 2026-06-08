import { useState, useEffect } from 'react';
import { View, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useDepartmentStore } from '@/stores/useDepartmentStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { getDepartmentByCode } from '@/constants/departments';
import { waittimeService } from '@/services/waittime.service';
import { departmentService } from '@/services/department.service';
import { Icon } from '@/components/ui/icon';
import { Clock, Users, AlertTriangle, X } from 'lucide-react-native';

export default function JoinQueueScreen() {
  const { dept } = useLocalSearchParams<{ dept: string }>();
  const departments = useDepartmentStore((s) => s.departments);
  const { joinQueue, isLoading } = useQueueStore();
  const department = departments.find((d) => d.code === dept);
  const meta = getDepartmentByCode(dept ?? '');
  const [wait, setWait] = useState<any>(null);
  const [status, setStatus] = useState<{ waitingCount: number; nowServing: string | null } | null>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (department) {
      waittimeService.estimateWait(department.id).then(setWait).catch(() => {});
      departmentService.getDepartmentStatus(department.id).then(setStatus).catch(() => {});
    }
  }, [department]);

  const handleJoin = async () => {
    if (!department) return;
    setJoining(true);
    try {
      const t = await joinQueue(department.id);
      setTicket(t);
    } catch (err: any) {}
    setJoining(false);
  };

  const position = ticket?.position ?? 0;
  const ahead = Math.max(position - 1, 0);
  const waitMinutes = wait
    ? Math.round(((wait.min_minutes ?? 0) + (wait.max_minutes ?? 15)) / 2)
    : null;

  return (
    <BottomSheet visible={true} onClose={() => router.back()}>
      <View style={{ maxHeight: Dimensions.get('window').height * 0.8 }}>
        <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
          <Button variant="ghost" onPress={() => router.back()} style={{ padding: 4 }}>
            <Icon as={X} size={22} color="#9CA3AF" />
          </Button>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {!ticket ? (
            <View style={{ gap: 20 }}>
              {/* Department header */}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 48, fontWeight: '800', color: '#004E98', fontFamily: 'PlusJakartaSans-ExtraBold' }}>
                  {meta?.prefix ?? department?.code}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' }}>
                  {department?.name}
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular', textAlign: 'center' }}>
                  {department?.description}
                </Text>
              </View>

              {/* Wait + Queue stats */}
              {wait && (
                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                  <View style={{ alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, minWidth: 120 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <Icon as={Clock} size={20} color="#004E98" />
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium' }}>Est. Wait</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold', marginTop: 2 }}>
                      {wait.display}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, minWidth: 120 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <Icon as={Users} size={20} color="#FF6700" />
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium' }}>Ahead</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold', marginTop: 2 }}>
                      {wait.people_ahead} waiting
                    </Text>
                  </View>
                </View>
              )}

              {/* Reminder */}
              <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18, fontFamily: 'Inter-Regular' }}>
                  <Text style={{ fontWeight: '600' }}>Important Reminder: </Text>
                  Please be ready to arrive within 5 minutes when your number is called.
                </Text>
              </View>

              <Button onPress={handleJoin} disabled={joining || isLoading} size="lg">
                {joining ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text>Get in Queue</Text>}
              </Button>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {/* Ticket header */}
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter-Medium' }}>Your Queue Number</Text>
                <Text style={{ fontSize: 48, fontWeight: '800', color: '#004E98', fontFamily: 'PlusJakartaSans-ExtraBold', letterSpacing: 2 }}>
                  {ticket.ticket_number}
                </Text>
                <View style={{ backgroundColor: '#DCFCE7', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#16A34A' }}>Active</Text>
                </View>
              </View>

              {/* Currently serving + Position */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center', flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium', marginBottom: 4 }}>Currently Serving</Text>
                  <Text style={{ fontSize: 24, lineHeight: 32, paddingTop: 4, includeFontPadding: false, fontWeight: '700', color: '#FF6700', fontFamily: 'PlusJakartaSans-Bold' }}>
                    {status?.nowServing ?? ticket.ticket_number.slice(0, 1) + '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Medium', marginBottom: 4 }}>Your Position</Text>
                  <Text style={{ fontSize: 24, lineHeight: 32, paddingTop: 4, includeFontPadding: false, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' }}>
                    {ahead > 0 ? `${ahead}${ahead === 1 ? 'st' : ahead === 2 ? 'nd' : ahead === 3 ? 'rd' : 'th'}` : 'Next'}
                  </Text>
                </View>
              </View>

              {/* Estimated wait */}
              {waitMinutes && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Icon as={Clock} size={16} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                    Estimated Wait: ~{waitMinutes} mins
                  </Text>
                </View>
              )}

              {/* Reminder */}
              <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Icon as={AlertTriangle} size={18} color="#F59E0B" style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18, fontFamily: 'Inter-Regular', flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>Important Reminder</Text>
                    {'\n'}Please be ready within 5 minutes when your number is called.
                  </Text>
                </View>
              </View>

              <Button onPress={() => router.replace('/(tabs)/my-queue')} size="lg">
                <Text>View My Queue</Text>
              </Button>
            </View>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
