import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft } from 'lucide-react-native';

export default function AboutScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'About',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 5 }}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' },
        headerTintColor: '#111827',
        headerBackTitleVisible: false,
      }} />

      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <Image source={require('../../assets/QueueLess-Logo-Transparent.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.appName}>QueueLess</Text>
          <Text style={styles.version}>Version 1.0.0-prototype</Text>

          <View style={styles.card}>
            <Text style={styles.desc}>
              Designed exclusively for Mapua Malayan Colleges Mindanao. QueueLess eliminates physical lines by allowing students and parents to join virtual queues, track wait times in real-time, and receive alerts when it's their turn.
            </Text>
          </View>
        </ScrollView>

        {/* Trademark Footer */}
        <View style={{ alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter-Medium', marginBottom: 4 }}>
            Built with love ❤️ by Auguzcht
          </Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter-Regular' }}>
            © 2026 QueueLess • MMCM
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  wrapper: { flex: 1, justifyContent: 'space-between' },
  scrollContent: { padding: 24, alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginTop: 20, marginBottom: 12 },
  logo: { width: 72, height: 72 },
  appName: {
    fontSize: 24,
    lineHeight: 32,
    paddingTop: 4,
    includeFontPadding: false,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  version: { fontSize: 14, color: '#9CA3AF', marginBottom: 28 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  desc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
});
