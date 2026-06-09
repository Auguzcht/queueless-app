import { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, RefreshControl, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { QueueNumberDisplay } from '@/components/queue/QueueNumberDisplay';
import { QueueStatusBadge } from '@/components/queue/QueueStatusBadge';
import { QueuePositionCard } from '@/components/queue/QueuePositionCard';
import { QueueProgressTracker } from '@/components/queue/QueueProgressTracker';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { queueService } from '@/services/queue.service';
import { router } from 'expo-router';
import { Ticket, ArrowRight, Clock, Users } from 'lucide-react-native';

export default function MyQueueScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { activeTickets, isLoading, fetchActiveTickets, cancelTicket } = useQueueStore();

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  useEffect(() => { if (userId) fetchActiveTickets(userId); }, [userId]);

  // Silent refresh on tab focus — no loading state to prevent scroll jump
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        queueService.getActiveTickets(userId).then((tickets) => {
          useQueueStore.setState({ activeTickets: tickets });
        }).catch(() => {});
      }
    }, [userId])
  );

  // Real-time subscription to own tickets
  useEffect(() => {
    if (!userId) return;
    const unsub = useQueueStore.getState().subscribeToMyTickets(userId);
    return unsub;
  }, [userId]);

  const tickets = activeTickets.filter((t) => t.status === 'waiting' || t.status === 'serving' || t.status === 'completed');

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => userId && fetchActiveTickets(userId)}
            tintColor="#004E98"
          />
        }
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 12 }}>
          <Text style={styles.title}>My Queue</Text>
          <Text style={styles.subtitle}>{tickets.length > 0 ? `${tickets.length} active ticket${tickets.length > 1 ? 's' : ''}` : 'No active tickets'}</Text>
        </View>

        {tickets.length > 0 ? (
          <View style={{ paddingHorizontal: 24, gap: 14 }}>
            {tickets.map((ticket, idx) => {
              const ahead = Math.max(ticket.position - 1, 0);
              return (
                <View key={ticket.id} style={styles.card}>
                  {/* Header row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Medium', marginBottom: 2 }}>Ticket</Text>
                      <Text style={{ fontSize: 22, fontWeight: '700', color: '#004E98', fontFamily: 'PlusJakartaSans-Bold', letterSpacing: 1 }}>
                        {ticket.ticket_number}
                      </Text>
                    </View>
                    <QueueStatusBadge status={ticket.status} />
                  </View>

                  {/* Stats row */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flex: 1 }}>
                      <Users size={14} color="#6B7280" />
                      <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                        {ahead > 0 ? `${ahead} ahead` : 'Next'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flex: 1 }}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>Position {ticket.position}</Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <QueueProgressTracker currentStep={ticket.status === 'completed' ? 'completed' : ticket.status === 'serving' ? 'called' : 'in_line'} />

                  {/* Cancel */}
                  {ticket.status === 'waiting' && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Cancel Ticket', `Cancel ${ticket.ticket_number}?`, [
                          { text: 'Keep', style: 'cancel' },
                          { text: 'Cancel', style: 'destructive', onPress: () => cancelTicket(ticket.id) },
                        ]);
                      }}
                      activeOpacity={0.7}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelText}>Cancel {ticket.ticket_number}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon as={Ticket} size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No active queue</Text>
            <Text style={styles.emptySub}>Join a queue to see it here</Text>
            <TouchableOpacity onPress={() => router.push('/services')} activeOpacity={0.8} style={styles.cta}>
              <Text style={styles.ctaText}>Browse Services</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  title: { fontSize: 32, lineHeight: 44, paddingTop: 4, includeFontPadding: false, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2, fontFamily: 'Inter-Regular' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cancelBtn: { backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'Inter-SemiBold' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 4, marginBottom: 24 },
  cta: { backgroundColor: '#004E98', borderRadius: 100, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
