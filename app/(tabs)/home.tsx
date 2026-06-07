import { useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { StatsRow } from '@/components/home/StatsRow';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentActivity } from '@/components/home/RecentActivity';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueueStore } from '@/stores/useQueueStore';

export default function HomeScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { activeTickets, isLoading, fetchActiveTickets } = useQueueStore();

  useEffect(() => { if (userId) fetchActiveTickets(userId); }, [userId]);

  const stats = {
    active: activeTickets.filter((t) => t.status === 'waiting' || t.status === 'serving').length,
    completed: activeTickets.filter((t) => t.status === 'completed').length,
    cancelled: activeTickets.filter((t) => t.status === 'cancelled').length,
  };

  return (
    <ScrollView className="flex-1 bg-secondary" refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => userId && fetchActiveTickets(userId)} />}>
      <GreetingHeader />
      <StatsRow {...stats} />
      <QuickActions />
      <RecentActivity tickets={activeTickets} />
    </ScrollView>
  );
}
