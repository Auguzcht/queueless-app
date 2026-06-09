import { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, RefreshControl, View, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MeshCanvas } from '@/components/home/MeshCanvas';
import { RecentActivity } from '@/components/home/RecentActivity';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Ticket, Bell, ArrowRight, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing as RNEasing } from 'react-native-reanimated';

const TXT_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.18)',
  textShadowOffset: { width: 0, height: 2 } as const,
  textShadowRadius: 8,
};

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);

  // Reset scroll position on tab focus
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const userId = useAuthStore((s) => s.session?.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const { activeTickets, isLoading, fetchActiveTickets } = useQueueStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  useEffect(() => { if (userId) fetchActiveTickets(userId); }, [userId]);

  const waiting = activeTickets.filter((t) => t.status === 'waiting');
  const serving = activeTickets.filter((t) => t.status === 'serving');
  const completed = activeTickets.filter((t) => t.status === 'completed');
  const hasActive = waiting.length > 0 || serving.length > 0;
  const activeTicket = waiting[0] || serving[0];
  const ringSize = Math.min(Dimensions.get('window').width * 0.42, 180);
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin';

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <MeshCanvas />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ flexGrow: 1, flexDirection: 'column', paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => userId && fetchActiveTickets(userId)} tintColor="#004E98" />}
      >
        <View style={{ paddingTop: 56, paddingHorizontal: 24, minHeight: 420, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <View style={{ flex: 1 }}>
              <Text className="text-white/80 text-sm font-body tracking-wide" style={TXT_SHADOW}>
                {['Good Morning', 'Good Afternoon', 'Good Evening'][Math.min(Math.floor(new Date().getHours() / 6), 2)]}
              </Text>
              <Text className="text-white font-display text-[26px] leading-[32px] font-bold" style={TXT_SHADOW}>{name}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/notifications')} activeOpacity={0.7} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Icon as={Bell} size={18} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'baseline', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter-Bold', alignItems: 'center' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings/edit-profile')} activeOpacity={0.7}>
              <Avatar alt={name} style={{ width: 40, height: 40 }} className="border-2 border-white/25">
                <AvatarImage source={{ uri: profile?.avatar_url ?? '', cache: 'force-cache' }} />
                <AvatarFallback style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="text-white font-bold text-sm" style={TXT_SHADOW}>{(profile?.first_name?.[0] || 'U').toUpperCase()}</Text>
                </AvatarFallback>
              </Avatar>
            </TouchableOpacity>
          </View>

          {isStaff ? (
            // Staff admin quick overview
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}>
              <TouchableOpacity
                onPress={() => router.push('/dash')}
                activeOpacity={0.8}
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center' }}
              >
                <Text className="text-white font-display text-xl font-bold" style={TXT_SHADOW}>Admin Dashboard</Text>
                <Text className="text-white/70 text-sm mt-1" style={TXT_SHADOW}>Manage department queues</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
                <View style={{ alignItems: 'center', minWidth: 70, overflow: 'visible' }}>
                  <Text className="text-white/70 text-[11px] font-semibold tracking-[1.5px] uppercase mb-2" style={TXT_SHADOW}>Active</Text>
                  <Text className="text-white font-bold text-center" style={[{ fontSize: 34, lineHeight: 44, paddingVertical: 8, includeFontPadding: false }, TXT_SHADOW]}>{waiting.length + serving.length}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }}>
                    {hasActive ? (
                      <View className="items-center px-2">
                        <Text className="text-white font-display font-extrabold tracking-tight" style={[{ fontSize: Math.min(ringSize * 0.2, 34), lineHeight: Math.min(ringSize * 0.28, 44), paddingTop: 2, includeFontPadding: false }, TXT_SHADOW]}>{activeTicket.ticket_number}</Text>
                        <Text className="text-white/60 font-semibold uppercase tracking-[1.5px] mt-0.5" style={[{ fontSize: 10 }, TXT_SHADOW]}>{activeTicket.status}</Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <Icon as={Ticket} size={ringSize * 0.15} color="rgba(255,255,255,0.6)" />
                        <Text className="text-white/70 font-display font-bold uppercase tracking-[1.5px] mt-1" style={[{ fontSize: Math.min(ringSize * 0.1, 14) }, TXT_SHADOW]}>No Queue</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'center', minWidth: 70, overflow: 'visible' }}>
                  <Text className="text-white/70 text-[11px] font-semibold tracking-[1.5px] uppercase mb-2" style={TXT_SHADOW}>Done</Text>
                  <Text className="text-white font-bold text-center" style={[{ fontSize: 34, lineHeight: 44, paddingVertical: 8, includeFontPadding: false }, TXT_SHADOW]}>{completed.length}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center', paddingBottom: 8 }}>
                {hasActive ? (
                  <View className="items-center gap-2">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 }}>
                      <Users size={14} color="rgba(255,255,255,0.7)" />
                      <Text className="text-white/80 text-sm font-medium" style={TXT_SHADOW}>Position {activeTicket.position}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/my-queue')} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text className="text-white/85 font-semibold text-sm" style={TXT_SHADOW}>View Details</Text>
                      <PulseArrow />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => router.push('/services')} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12 }}>
                    <Icon as={Ticket} size={16} color="rgba(255,255,255,0.9)" />
                    <Text className="text-white font-semibold text-sm" style={TXT_SHADOW}>Join a Queue</Text>
                    <PulseArrow />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        <View style={{ backgroundColor: '#F8F9FA', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 20, flex: 1, minHeight: Dimensions.get('window').height * 0.65, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 }}>
          <RecentActivity tickets={activeTickets} />
          <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: 2000, backgroundColor: '#F8F9FA' }} />
        </View>
      </ScrollView>
    </View>
  );
}

function PulseArrow() {
  const offset = useSharedValue(0);
  useEffect(() => { offset.value = withRepeat(withTiming(5, { duration: 900, easing: RNEasing.inOut(RNEasing.sin) }), -1, true); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  return <Animated.View style={style}><ArrowRight size={16} color="rgba(255,255,255,0.8)" /></Animated.View>;
}
