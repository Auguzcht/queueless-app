# src/constants/ — Theme Tokens & Configuration

Static values used across the app. Nothing here changes at runtime — for dynamic state, use stores.

## Files

```
constants/
├── theme.ts            # Design system tokens (colors, typography, spacing, etc.)
├── departments.ts      # Static department metadata for fast lookups
├── config.ts           # App-wide configuration values
└── index.ts            # Re-exports
```

## theme.ts

All design tokens from the QueueLess design system:

```typescript
export const COLORS = {
  primary:        '#004E98',   // Steel Azure — headers, CTAs, nav, branding
  primaryLight:   '#3A6EA5',   // Cornflower Ocean — active states, links
  accent:         '#FF6700',   // Pumpkin Spice — attention, badges, important actions

  bgPrimary:      '#FFFFFF',
  bgSecondary:    '#F5F7FA',   // Slightly cooler than Platinum for cards
  bgTertiary:     '#EBEBEB',   // Platinum — dividers, disabled
  border:         '#E2E8F0',

  textPrimary:    '#1A1A2E',
  textSecondary:  '#6B7280',
  textMuted:      '#9CA3AF',

  success:        '#22C55E',
  warning:        '#F59E0B',
  error:          '#EF4444',

  surface:        '#FFFFFF',
} as const;

export const FONTS = {
  heading: {
    family: 'PlusJakartaSans',
    weights: { semibold: '600', bold: '700', extrabold: '800' },
  },
  body: {
    family: 'Inter',
    weights: { regular: '400', medium: '500', semibold: '600' },
  },
} as const;

export const FONT_SIZES = {
  display:    32,
  h1:         28,
  h2:         22,
  h3:         18,
  bodyLarge:  16,
  body:       14,
  bodySmall:  12,
  caption:    11,
  label:      13,
  button:     15,
  queueNumber: 48,
} as const;

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
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
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
} as const;
```

## departments.ts

Fast in-memory lookup for department metadata (avoids querying for display-only data):

```typescript
export const DEPARTMENT_MAP = {
  ADM: { prefix: 'A', name: 'Admissions',   icon: 'graduation-cap', color: '#004E98' },
  REG: { prefix: 'R', name: 'Registrar',    icon: 'file-text',      color: '#3A6EA5' },
  TRS: { prefix: 'T', name: 'Treasury',     icon: 'landmark',       color: '#FF6700' },
  SCH: { prefix: 'S', name: 'Scholarships', icon: 'dollar-sign',    color: '#22C55E' },
  HLP: { prefix: 'H', name: 'Help Desk',    icon: 'help-circle',    color: '#6B7280' },
} as const;

export const DEPARTMENT_CODES = Object.keys(DEPARTMENT_MAP) as (keyof typeof DEPARTMENT_MAP)[];
export const PREFIXES = Object.values(DEPARTMENT_MAP).map(d => d.prefix);
```

## config.ts

```typescript
export const CONFIG = {
  // Queue behavior
  GRACE_PERIOD_MINUTES: 5,        // Time to arrive after being called
  MAX_ACTIVE_TICKETS_PER_DEPT: 1, // One active ticket per department
  NOTIFICATION_THRESHOLD: 2,      // Notify when N people ahead
  QUEUE_RESET_HOUR: 6,            // Daily reset at 6:00 AM

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  // Push notifications
  EXPO_PUSH_ENDPOINT: 'https://exp.host/--/api/v2/push/send',

  // Image upload
  AVATAR_MAX_SIZE_MB: 5,
  AVATAR_QUALITY: 0.8,
  AVATAR_DIMENSIONS: { width: 400, height: 400 },

  // Realtime
  REALTIME_RECONNECT_DELAY_MS: 3000,

  // Deep link scheme
  SCHEME: 'queueless',
} as const;
```

## Conventions

- All values are `as const` for literal types
- Group related tokens into objects (COLORS, FONTS, etc.)
- Use this for values known at build time — not for server-fetched config
- Import from `@/constants` (path alias configured in tsconfig)
