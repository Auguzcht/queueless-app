import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, LayoutGrid, Ticket, User } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Platform, View } from 'react-native';

const TABS = [
  { name: 'home', title: 'Home', icon: Home },
  { name: 'services', title: 'Services', icon: LayoutGrid },
  { name: 'my-queue', title: 'My Queue', icon: Ticket },
  { name: 'profile', title: 'Profile', icon: User },
] as const;

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
            backgroundColor: 'rgba(255,255,255,0.88)', borderTopWidth: 0, elevation: 0,
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: Platform.OS === 'ios' ? 85 : 65, paddingTop: 4,
            paddingBottom: Platform.OS === 'ios' ? 28 : 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.06, shadowRadius: 12,
          },
          tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 10, fontWeight: '500', letterSpacing: 0.3, marginTop: 6 },
          tabBarIcon: ({ focused }) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;
            return (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <Icon as={tab.icon} size={22} color={focused ? '#004E98' : '#9CA3AF'} />
              </View>
            );
          },
        })}
      >
        {TABS.map(({ name, title }) => (
          <Tabs.Screen key={name} name={name} options={{ title }} />
        ))}
      </Tabs>
    </View>
  );
}
