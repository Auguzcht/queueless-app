// Theme tokens for QueueLess design system
// Derived from brand palette, optimized for mobile readability

export const COLORS = {
  primary: '#004E98',
  primaryLight: '#3A6EA5',
  accent: '#FF6700',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F5F7FA',
  bgTertiary: '#EBEBEB',
  border: '#E2E8F0',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const FONTS = {
  display: 'PlusJakartaSans-ExtraBold',
  heading: 'PlusJakartaSans-Bold',
  heading2: 'PlusJakartaSans-SemiBold',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  label: 'Inter-SemiBold',
  caption: 'Inter-Medium',
  bodySmall: 'Inter-Regular',
  mono: 'Inter-Regular',
} as const;

export const FONT_SIZES = {
  display: 32,
  h1: 28,
  h2: 22,
  h3: 18,
  bodyLarge: 16,
  body: 14,
  bodySmall: 12,
  caption: 11,
  label: 13,
  button: 15,
  queueNumber: 48,
} as const;

export const FONT_WEIGHTS = {
  display: '800' as const,
  h1: '700' as const,
  h2: '700' as const,
  h3: '600' as const,
  bodyLarge: '400' as const,
  body: '400' as const,
  bodySmall: '400' as const,
  caption: '500' as const,
  label: '600' as const,
  button: '600' as const,
  queueNumber: '800' as const,
};

export const LINE_HEIGHTS = {
  display: 35,
  h1: 34,
  h2: 29,
  h3: 25,
  bodyLarge: 24,
  body: 21,
  bodySmall: 17,
  caption: 14,
  label: 16,
  button: 15,
  queueNumber: 48,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
} as const;

export const ANIMATION = {
  screenEnter: { duration: 300, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
  cardAppear: { duration: 200, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
  spring: { damping: 15, stiffness: 150 },
  tabSwitch: { duration: 200, easing: 'ease' },
  buttonPress: { duration: 100, scaling: 0.97 },
} as const;
