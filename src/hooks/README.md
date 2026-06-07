# src/hooks/ — Custom React Hooks

Reusable hooks that encapsulate complex logic, side effects, and store subscriptions.

## Files

```
hooks/
├── useAuth.ts                  # Auth state + session listener
├── useQueue.ts                 # Realtime queue subscription
├── useQueueDetails.ts          # Single ticket with live position updates
├── usePushNotifications.ts     # Push token + notification listeners
├── useCountdown.ts             # Animated countdown timer
├── useRefreshOnFocus.ts        # Re-fetch data on screen focus
├── useDepartments.ts           # Load departments on mount
├── useDebounce.ts              # Debounced value
├── useNetworkStatus.ts         # Online/offline detection
└── useImagePicker.ts           # Camera/gallery picker for avatar
```

## Hook Contracts

### useAuth

Wraps `useAuthStore` and sets up the Supabase auth state listener. Use this in screens that need auth context.

```typescript
const { session, profile, isLoading, isAuthenticated, signOut } = useAuth();
```

Internally calls `supabase.auth.onAuthStateChange()` on mount and syncs changes into `useAuthStore`.

### useQueue

Subscribes to Supabase Realtime for a specific department's queue. Manages the subscription lifecycle (subscribe on mount, unsubscribe on unmount).

```typescript
const { liveBoard, isConnected, nowServing, waitingCount } = useQueue(departmentId);
```

Returns the live queue board and derived data. Automatically cleans up the realtime channel on unmount.

### useQueueDetails

Fetches a single ticket's details and keeps the "position ahead" count updated via realtime.

```typescript
const { ticket, positionAhead, estimatedWait, isLoading } = useQueueDetails(ticketId);
```

### usePushNotifications

Handles the full push notification lifecycle:
1. Requests permission on mount
2. Gets the Expo push token
3. Registers it with Supabase
4. Sets up notification received/response listeners
5. Cleans up on unmount

```typescript
const { expoPushToken, permissionStatus } = usePushNotifications();
```

The received listener adds notifications to `useNotificationStore`. The response listener handles deep-link navigation when the user taps a notification.

### useCountdown

Returns a countdown from the estimated wait time, updating every second.

```typescript
const { minutes, seconds, display, isExpired } = useCountdown(targetDate);
// display = "14:32" or "< 1 min"
```

### useRefreshOnFocus

Re-runs a callback when the screen comes back into focus (e.g., switching tabs).

```typescript
useRefreshOnFocus(() => {
  fetchActiveTickets();
  fetchUnreadCount();
});
```

Uses `useFocusEffect` from `@react-navigation/native` under the hood.

### useDepartments

Loads the department list on mount if not already in the store.

```typescript
const { departments, isLoading } = useDepartments();
```

### useDebounce

Standard debounce for search inputs.

```typescript
const debouncedSearch = useDebounce(searchText, 300);
```

### useNetworkStatus

Monitors network connectivity using `@react-native-community/netinfo`.

```typescript
const { isConnected, isInternetReachable } = useNetworkStatus();
```

Used by `OfflineBanner` component to show/hide connectivity warning.

### useImagePicker

Wraps `expo-image-picker` for profile avatar selection.

```typescript
const { pickImage, takePhoto, selectedImage } = useImagePicker({
  aspect: [1, 1],
  quality: 0.8,
  allowsEditing: true,
});
```

## Conventions

- Hooks start with `use` prefix
- Each hook is a single file with a single default or named export
- Hooks handle their own cleanup (unsubscribe, remove listeners) in return functions
- Hooks that fetch data expose `isLoading` and `error` states
- Prefer composition: hooks can use other hooks, but avoid deep nesting (max 2 levels)
- Keep hooks pure of UI concerns — they return data and actions, not JSX
