import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Linking, Image } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, ChevronDown, Mail, Phone, Briefcase, Globe } from 'lucide-react-native';

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

function FAQItem({ faq, isOpen, onToggle }: { faq: typeof FAQS[0]; isOpen: boolean; onToggle: () => void }) {
  const rotate = useSharedValue(0);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withSpring(isOpen ? '180deg' : '0deg', SPRING_CONFIG) }],
  }));

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.faqItem}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{faq.q}</Text>
        <Animated.View style={iconStyle}>
          <Icon as={ChevronDown} size={18} color="#9CA3AF" />
        </Animated.View>
      </View>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <Text style={styles.faqA}>{faq.a}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const FAQS = [
  {
    q: 'What is QueueLess?',
    a: 'QueueLess is a mobile virtual queue management system built for Mapua Malayan Colleges Mindanao (MMCM). It lets you join queues for campus offices remotely, track your position in real-time, and receive alerts when it\'s your turn.',
  },
  {
    q: 'How do I join a queue?',
    a: 'Go to the Services tab, select the office you need (Admissions, Registrar, Treasury, Scholarships, or Help Desk), then tap "Join Queue". You\'ll receive a ticket number and can track your position live.',
  },
  {
    q: 'Can I join multiple queues at once?',
    a: 'You can only have one active ticket per department at a time. This prevents ticket hoarding and ensures fair access for everyone.',
  },
  {
    q: 'What do the ticket prefixes mean?',
    a: 'Each office has a unique prefix: A for Admissions, R for Registrar, T for Treasury, S for Scholarships, and H for Help Desk. Your ticket number combines the prefix with a sequence number (e.g., A45, R120).',
  },
  {
    q: 'What happens if I miss my turn?',
    a: 'When it\'s your turn, you\'ll receive a push notification. You have 5 minutes to arrive at the counter before the system automatically skips your ticket.',
  },
  {
    q: 'How do I cancel my ticket?',
    a: 'Go to My Queue tab, find your active ticket, and tap "Cancel Ticket". You can rejoin the queue anytime after cancelling.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Your personal information is encrypted and stored securely using Supabase with Row-Level Security. Only you and authorized MMCM administration can access your data.',
  },
  {
    q: 'When is support available?',
    a: 'QueueLess operates during MMCM office hours (weekdays, 8:00 AM – 5:00 PM). Queues reset daily and numbering restarts each morning.',
  },
];

export default function HelpScreen() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Help & Support',
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Developer Contact */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <Image source={require('../../assets/Nodado-Profile.jpg')} style={{ width: 56, height: 56, borderRadius: 28 }} />
            <View style={{ height: 56, justifyContent: 'center', marginTop: 12 }}>
              <Text style={styles.devName}>Alfred Dads D. Nodado</Text>
              <Text style={styles.devRole}>Auguzcht — Full Stack Developer</Text>
            </View>
          </View>
          <Text style={styles.devNote}>This prototype has not yet been handed over to MMCM. For all inquiries, feedback, and reports, reach out directly:</Text>

          <View style={styles.contactRow}>
            <Icon as={Phone} size={18} color="#004E98" />
            <Text style={styles.contactLabel}>+63 947 483 7271</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:alfredndado@gmail.com')} style={styles.contactRow}>
            <Icon as={Mail} size={18} color="#004E98" />
            <Text style={[styles.contactLabel, { color: '#004E98', textDecorationLine: 'underline' }]}>alfredndado@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/alfred-nodado-b24647251/')} style={styles.contactRow}>
            <Icon as={Briefcase} size={18} color="#004E98" />
            <Text style={[styles.contactLabel, { color: '#004E98', textDecorationLine: 'underline' }]}>linkedin.com/in/alfred-nodado</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/adnodado22/')} style={styles.contactRow}>
            <Icon as={Globe} size={18} color="#004E98" />
            <Text style={[styles.contactLabel, { color: '#004E98', textDecorationLine: 'underline' }]}>facebook.com/adnodado22</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} faq={faq} isOpen={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  devName: {
    fontSize: 18, fontWeight: '700', color: '#111827', fontFamily: 'PlusJakartaSans-Bold',
  },
  devRole: {
    fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 12, fontFamily: 'Inter-Regular',
  },
  devNote: {
    fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12, fontFamily: 'Inter-Regular',
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
  },
  contactLabel: {
    fontSize: 14, color: '#111827', fontFamily: 'Inter-Regular',
  },
  faqItem: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  faqQ: {
    fontSize: 14, color: '#111827', fontWeight: '500', flex: 1, marginRight: 8,
    fontFamily: 'Inter-Medium',
  },
  faqA: {
    fontSize: 13, color: '#6B7280', lineHeight: 19, marginTop: 8, fontFamily: 'Inter-Regular',
  },
});
