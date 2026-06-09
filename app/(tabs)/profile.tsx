import { ScrollView, View, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';
import { ClipboardList, Bell, User, Shield, HelpCircle, Info, LogOut, ChevronRight } from 'lucide-react-native';

const MENU = [
  { icon: ClipboardList, label: 'Queue History', route: '/settings/queue-history' },
  { icon: Bell, label: 'Notification Settings', route: '/settings/notification-settings' },
  { icon: User, label: 'Edit Profile', route: '/settings/edit-profile' },
  { icon: Shield, label: 'Privacy & Security', route: '/settings/privacy' },
  { icon: HelpCircle, label: 'Help & Support', route: '/settings/help' },
  { icon: Info, label: 'About', route: '/settings/about' },
  { icon: LogOut, label: 'Sign Out', route: 'signout' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuthStore();
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin';
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar alt={name} style={styles.avatar}>
            <AvatarImage source={{ uri: profile?.avatar_url ?? '', cache: 'force-cache' }} />
            <AvatarFallback style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
            </AvatarFallback>
          </Avatar>
          <Text style={styles.profileName}>{name}</Text>
          {profile?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</Text>
            </View>
          )}
        </View>

        {/* Admin link (staff only) */}
        {isStaff && (
          <TouchableOpacity
            onPress={() => router.push('/dash')}
            activeOpacity={0.7}
            style={[styles.menuCard, { marginBottom: 20, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon as={Shield} size={20} color="#004E98" />
              <Text style={{ fontSize: 15, color: '#004E98', fontWeight: '600', fontFamily: 'Inter-SemiBold' }}>Admin Dashboard</Text>
            </View>
            <ChevronRight size={18} color="#D1D5DB" />
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                if (item.route === 'signout') { Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }]); return; }
                router.push(item.route as any);
              }}
              activeOpacity={0.7}
              style={[styles.menuRow, item.route === 'signout' && { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4 }]}
            >
              <View style={styles.menuLeft}>
                <Icon as={item.icon} size={20} color={item.route === 'signout' ? '#EF4444' : '#6B7280'} />
                <Text style={[styles.menuLabel, item.route === 'signout' && { color: '#EF4444' }]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
    paddingTop: 4,
    includeFontPadding: false,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
  },
  avatarFallback: {
    backgroundColor: '#004E98',
    width: '100%',
    height: '100%',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    fontFamily: 'Inter-SemiBold',
  },
  roleBadge: {
    backgroundColor: 'rgba(0, 78, 152, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004E98',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
});
