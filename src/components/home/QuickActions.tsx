import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, RADIUS, SHADOWS } from '@/constants/theme';
import { router } from 'expo-router';
import { Ticket, ClipboardList, Bell, Eye } from 'lucide-react-native';

const ACTIONS = [
  { icon: Ticket, iconColor: COLORS.primary, label: 'Join Queue', route: '/services' },
  { icon: ClipboardList, iconColor: COLORS.success, label: 'My Tickets', route: '/my-queue' },
  { icon: Bell, iconColor: COLORS.accent, label: 'Notifications', route: '/notifications' },
  { icon: Eye, iconColor: COLORS.primaryLight, label: 'Live Board', route: '/services' },
] as const;

export function QuickActions() {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.action}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.iconColor + '15' }]}>
            <action.icon size={24} color={action.iconColor} strokeWidth={1.5} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  action: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});
