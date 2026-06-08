import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, LayoutGrid, Ticket, User } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const TABS = [
  { name: 'home', title: 'Home', icon: Home },
  { name: 'services', title: 'Services', icon: LayoutGrid },
  { name: 'my-queue', title: 'My Queue', icon: Ticket },
  { name: 'profile', title: 'Profile', icon: User },
] as const;

function AnimatedTabIcon({ icon: IconComp, focused }: { icon: typeof Home; focused: boolean }) {
  const scale = useSharedValue(focused ? 1 : 0.85);
  const bgOpacity = useSharedValue(focused ? 1 : 0);
  const bgStyle = useAnimatedStyle(() => ({
    opacity: withTiming(bgOpacity.value, { duration: 200 }),
    transform: [{ scale: withSpring(scale.value, { mass: 0.6, stiffness: 180 }) }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { mass: 0.6, stiffness: 180 }) }],
  }));
  scale.value = focused ? 1 : 0.85;
  bgOpacity.value = focused ? 1 : 0;
  return (
    <Animated.View className="w-10 h-10 items-center justify-center">
      <Animated.View className="absolute inset-0 rounded-full bg-primary/10" style={bgStyle} />
      <Animated.View style={iconStyle}>
        <Icon as={IconComp} size={22} color={focused ? '#004E98' : '#9CA3AF'} />
      </Animated.View>
    </Animated.View>
  );
}

function AnimatedTabLabel({ label, focused }: { label: string; focused: boolean }) {
  const translateY = useSharedValue(focused ? 0 : 4);
  const opacity = useSharedValue(focused ? 1 : 0.5);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(translateY.value, { duration: 200, easing: Easing.out(Easing.quad) }) }],
    opacity: withTiming(opacity.value, { duration: 200 }),
  }));
  translateY.value = focused ? 0 : 4;
  opacity.value = focused ? 1 : 0.5;
  return (
    <Animated.Text style={[style, {
      fontFamily: 'Inter-Medium', fontSize: 10, fontWeight: '500', letterSpacing: 0.3,
      color: focused ? '#004E98' : '#9CA3AF', marginTop: 6,
    }]}>
      {label}
    </Animated.Text>
  );
}

function AnimatedTabButton({ children, onPress, onLongPress, accessibilityRole, accessibilityState, ...rest }: any) {
  const s = useSharedValue(1);
  return (
    <Pressable onPress={(e) => {
      s.value = withSpring(0.92, { mass: 0.3, stiffness: 300 }, () => { s.value = withSpring(1, { mass: 0.3, stiffness: 300 }); });
      onPress?.(e);
    }} onLongPress={onLongPress} accessibilityRole={accessibilityRole} accessibilityState={accessibilityState} {...rest}>
      <Animated.View style={{ transform: [{ scale: s }] }} className="items-center justify-center pt-1">
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#004E98',
          tabBarInactiveTintColor: '#9CA3AF',
          sceneContainerStyle: { backgroundColor: 'transparent' },
          tabBarStyle: {
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderTopWidth: 0,
            elevation: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingTop: 4,
            paddingBottom: Platform.OS === 'ios' ? 28 : 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
          tabBarLabel: ({ focused }) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;
            return <AnimatedTabLabel label={tab.title} focused={focused} />;
          },
          tabBarIcon: ({ focused }) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;
            return <AnimatedTabIcon icon={tab.icon} focused={focused} />;
          },
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        })}
      >
        {TABS.map(({ name, title }) => (
          <Tabs.Screen key={name} name={name} options={{ title }} />
        ))}
      </Tabs>
    </View>
  );
}
