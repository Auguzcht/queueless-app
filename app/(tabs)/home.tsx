import { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Dimensions, ScrollView, RefreshControl, View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing as RNEasing } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { RecentActivity } from '@/components/home/RecentActivity';
import { MeshCanvas } from '@/components/home/MeshCanvas';

import { useAuthStore } from '@/stores/useAuthStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { Ticket, Bell, ArrowRight, Users } from 'lucide-react-native';
import { router } from 'expo-router';

const { height } = Dimensions.get('window');

const TXT_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.18)',
  textShadowOffset: { width: 0, height: 2 } as const,
  textShadowRadius: 8,
};

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const userId = useAuthStore((s) => s.session?.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const { activeTickets, isLoading, fetchActiveTickets } = useQueueStore();
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  useEffect(() => {
    if (userId) fetchActiveTickets(userId);
  }, [userId]);

  // Reset scroll position on tab focus
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const waiting = activeTickets.filter((t) => t.status === 'waiting');
  const serving = activeTickets.filter((t) => t.status === 'serving');
  const completed = activeTickets.filter((t) => t.status === 'completed');
  const hasActive = waiting.length > 0 || serving.length > 0;
  const activeTicket = waiting[0] || serving[0];

  const ringSize = Math.min(Dimensions.get('window').width * 0.42, 180);

  return (
    <View style={styles.root}>
      <MeshCanvas />
      {/* Scrollable Foreground */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {/* ── TOP SECTION: Transparent, floating UI ──────────── */}
        <View style={styles.topTransparentSection}>
          {/* Greeting row */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-9">
              <View className="flex-1">
                <Text className="text-white/70 text-sm font-body tracking-wide" style={TXT_SHADOW}>
                  {getGreeting()}
                </Text>
                <Text className="text-white font-display text-[26px] leading-[32px] font-bold" style={TXT_SHADOW}>
                  {name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
                className="w-10 h-10 rounded-full bg-white/15 items-center justify-center mr-2.5"
              >
                <Icon as={Bell} size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Avatar alt={name} className="w-10 h-10 border-2 border-white/25">
                <AvatarImage source={{ uri: profile?.avatar_url ?? '' }} />
                <AvatarFallback className="bg-white/15">
                  <Text className="text-white font-bold text-sm" style={TXT_SHADOW}>
                    {(profile?.first_name?.[0] || 'U').toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>
          </View>

          {/* 3-column */}
          <View className="px-6">
            <View className="flex-row items-center justify-between">
              
              {/* Left Column */}
              <View className="items-center" style={{ minWidth: 70, overflow: 'visible' }}>
                <Text className="text-white/70 text-[11px] font-semibold tracking-[1.5px] uppercase mb-2" style={TXT_SHADOW}>Active</Text>
                <Text 
                  className="text-white font-bold text-center" 
                  style={[
                    { 
                      fontSize: 34, 
                      lineHeight: 44,
                      paddingVertical: 8,
                      includeFontPadding: false,
                    }, 
                    TXT_SHADOW,
                  ]}
                >
                  {waiting.length + serving.length}
                </Text>
              </View>

              {/* Center Column */}
              <View className="items-center">
                <View style={{
                  width: ringSize, height: ringSize, borderRadius: ringSize / 2,
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasActive ? (
                    <View className="items-center px-2">
                      <Text className="text-white font-display font-extrabold tracking-tight"
                        style={[{ fontSize: Math.min(ringSize * 0.2, 34), lineHeight: Math.min(ringSize * 0.28, 44), paddingTop: 2, includeFontPadding: false }, TXT_SHADOW]}>
                        {activeTicket.ticket_number}
                      </Text>
                      <Text className="text-white/60 font-semibold uppercase tracking-[1.5px] mt-0.5"
                        style={[{ fontSize: 10 }, TXT_SHADOW]}>{activeTicket.status}</Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <Icon as={Ticket} size={ringSize * 0.15} color="rgba(255,255,255,0.6)" />
                      <Text className="text-white/70 font-display font-bold uppercase tracking-[1.5px] mt-1"
                        style={[{ fontSize: Math.min(ringSize * 0.1, 14) }, TXT_SHADOW]}>No Queue</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Right Column */}
              <View className="items-center" style={{ minWidth: 70, overflow: 'visible' }}>
                <Text className="text-white/70 text-[11px] font-semibold tracking-[1.5px] uppercase mb-2" style={TXT_SHADOW}>Done</Text>
                <Text 
                  className="text-white font-bold text-center" 
                  style={[
                    { 
                      fontSize: 34, 
                      lineHeight: 44,
                      paddingVertical: 8,
                      includeFontPadding: false,
                    }, 
                    TXT_SHADOW,
                  ]}
                >
                  {completed.length}
                </Text>
              </View>

            </View>
          </View>
        </View>

        {/* ── CTA SECTION — between top and drawer ──────────── */}
        <View className="px-6 pb-6 items-center" style={{ marginTop: -8 }}>
          {hasActive ? (
            <View className="items-center gap-2">
              <View className="flex-row items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Users size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/80 text-sm font-medium" style={TXT_SHADOW}>
                  Position {activeTicket.position}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/my-queue')} activeOpacity={0.8} className="flex-row items-center gap-1.5">
                <Text className="text-white/85 font-semibold text-sm" style={TXT_SHADOW}>View Details</Text>
                <PulseArrow />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/services')}
              activeOpacity={0.8}
              className="bg-white/15 rounded-full px-6 py-3 flex-row items-center gap-2"
            >
              <Ticket size={16} color="rgba(255,255,255,0.9)" />
              <Text className="text-white font-semibold text-sm" style={TXT_SHADOW}>Join a Queue</Text>
              <PulseArrow />
            </TouchableOpacity>
          )}
        </View>

        {/* ── BOTTOM SECTION: Solid white drawer, masks gradient ── */}
        <View style={styles.bottomSolidSection}>
          <RecentActivity tickets={activeTickets} />
          {/* Bottom Overscroll Curtain — paints out-of-bounds below */}
          <View
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              height: 2000,
              backgroundColor: '#F8F9FA',
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topTransparentSection: {
    paddingTop: 60,
    paddingBottom: 16,
  },
  bottomSolidSection: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    minHeight: height * 0.65,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
});

// ── Animated bouncing arrow ────────────────────────────────────────
function PulseArrow() {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.value = withRepeat(
      withTiming(5, { duration: 900, easing: RNEasing.inOut(RNEasing.sin) }),
      -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));
  return (
    <Animated.View style={style}>
      <ArrowRight size={16} color="rgba(255,255,255,0.8)" />
    </Animated.View>
  );
}
