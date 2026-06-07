import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, LayoutGrid, Ticket, User } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

const TABS = [
  { name: 'home', title: 'Home', icon: Home },
  { name: 'services', title: 'Services', icon: LayoutGrid },
  { name: 'my-queue', title: 'My Queue', icon: Ticket },
  { name: 'profile', title: 'Profile', icon: User },
] as const;

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#004E98',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0', borderTopWidth: 1, paddingTop: 6, paddingBottom: 20, height: 65 },
        tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 10, fontWeight: '500' },
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          return <Icon as={tab.icon} size={22} color={focused ? '#004E98' : '#6B7280'} />;
        },
      })}
    >
      {TABS.map(({ name, title }) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}
