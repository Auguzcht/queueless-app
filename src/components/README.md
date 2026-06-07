# src/components/ — UI Components

All reusable React Native components, organized by domain.

## Folder Structure

```
components/
├── ui/        # Design system primitives (app-agnostic)
├── queue/     # Queue-domain components
├── auth/      # Authentication form components
├── home/      # Home screen sections
└── layout/    # Shared layout wrappers
```

## Conventions

- Every component is a single file: `ComponentName.tsx`
- Default export only: `export default function Button() { ... }`
- Props defined as a TypeScript interface above the component
- Styling uses Nativewind classNames referencing theme tokens
- Animations via Reanimated 3 (`useAnimatedStyle`, `withSpring`, `withTiming`)
- No business logic in components — call hooks or store actions instead

## ui/ — Design System Primitives

These are generic, reusable everywhere. They know nothing about queues.

| Component | Description | Props |
|-----------|-------------|-------|
| `Button.tsx` | Primary, secondary, ghost, destructive variants | `variant`, `size`, `loading`, `disabled`, `onPress`, `children` |
| `Card.tsx` | Elevated surface with shadow and optional left accent border | `accent?` (color), `onPress?`, `children` |
| `Badge.tsx` | Status pill — colored bg at 15% opacity + full text | `variant` ('active' / 'waiting' / 'completed' / 'cancelled'), `label` |
| `Input.tsx` | Text input with label, error message, optional left/right icon | `label`, `error?`, `leftIcon?`, `rightIcon?`, + TextInput props |
| `Avatar.tsx` | Circular image with fallback to colored initials | `uri?`, `name`, `size` |
| `Skeleton.tsx` | Animated loading placeholder (shimmer effect) | `width`, `height`, `radius?` |
| `Toast.tsx` | Top-sliding notification toast | `type` ('success' / 'error' / 'info'), `message`, `visible` |
| `BottomSheet.tsx` | Modal bottom sheet (wraps @gorhom/bottom-sheet) | `snapPoints`, `children`, `onClose` |
| `Divider.tsx` | Horizontal line separator | `spacing?` |
| `EmptyState.tsx` | Illustration + title + subtitle for empty lists | `icon`, `title`, `subtitle`, `action?` |
| `IconButton.tsx` | Circular icon-only button | `icon`, `onPress`, `variant?` |

### Button Variants

```tsx
<Button variant="primary">Join Queue</Button>        // #004E98 bg, white text
<Button variant="secondary">Cancel</Button>          // White bg, #004E98 border
<Button variant="ghost">View All</Button>            // Transparent, blue text
<Button variant="destructive">Cancel Queue</Button>  // #EF4444 bg, white text
```

### Badge Variants

```tsx
<Badge variant="active" label="Active" />       // Green bg/text
<Badge variant="waiting" label="Waiting" />      // Blue bg/text
<Badge variant="completed" label="Completed" />  // Gray bg/text
<Badge variant="cancelled" label="Cancelled" />  // Red bg/text
<Badge variant="serving" label="Serving" />      // Orange bg/text
```

## queue/ — Queue Domain Components

| Component | Description |
|-----------|-------------|
| `QueueNumberDisplay.tsx` | Large ticket number (A123) with animated count-up. Plus Jakarta Sans 800, 48px. |
| `QueueStatusBadge.tsx` | Wraps Badge with queue-specific status mapping |
| `QueuePositionCard.tsx` | "People ahead of you: 12" with icon |
| `QueueProgressTracker.tsx` | Horizontal stepper: Joined → In Line → Almost → At Counter |
| `LiveBoardItem.tsx` | Single row in the live queue board: ticket number + counter + people waiting |
| `DepartmentCard.tsx` | Tappable card with department icon, name, description, and chevron |
| `WaitTimeEstimate.tsx` | "~15-20 mins" display with clock icon |
| `QueueTicketCard.tsx` | Card for Recent Activity: department name + status badge + ticket number + timestamp |
| `NowServingBanner.tsx` | "NOW SERVING: A123 → Counter 2" with pulsing animation |

## auth/ — Auth Components

| Component | Description |
|-----------|-------------|
| `LoginForm.tsx` | Email + password inputs + submit. Uses React Hook Form + Zod. |
| `RegisterForm.tsx` | Full registration form with domain validation |
| `DomainEmailInput.tsx` | Input with a fixed `@mcm.edu.ph` suffix visual hint |
| `PasswordStrengthMeter.tsx` | Visual indicator for password strength |

## home/ — Home Screen Sections

| Component | Description |
|-----------|-------------|
| `GreetingHeader.tsx` | Gradient banner: "Good Morning, Joshua" + notification bell |
| `StatsRow.tsx` | Three pill cards: Active Queue / Completed / Cancelled counts |
| `QuickActions.tsx` | 2x2 icon grid: Join Queue, My Tickets, Notifications, Settings |
| `RecentActivity.tsx` | FlatList of QueueTicketCard items with "View All" link |

## layout/ — Shared Layout

| Component | Description |
|-----------|-------------|
| `SafeAreaWrapper.tsx` | SafeAreaView + StatusBar configuration |
| `ScreenHeader.tsx` | Back arrow + centered title + optional right action button |
| `TabBar.tsx` | Custom bottom tab bar matching design system |
| `KeyboardAvoidWrapper.tsx` | Handles keyboard avoidance for forms |
| `OfflineBanner.tsx` | Red banner shown when device loses connectivity |

## Creating a New Component

1. Choose the right subfolder (or `ui/` if generic)
2. Create `ComponentName.tsx`
3. Define a `Props` interface
4. Use Nativewind for styling
5. Add animations with Reanimated if the component has visual state changes
6. Update this README with the new component
