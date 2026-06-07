# src/stores/ — Zustand State Management

Lightweight, provider-free state management with Zustand. Each store is a standalone slice, imported and used directly in components.

## Why Zustand

- **No providers** — no wrapper nesting in React Native
- **Selector-based** — components only re-render when their selected slice changes
- **Works outside React** — services and utils can read/write state directly
- **Tiny** — ~1KB, no dependencies
- **Middleware** — built-in `persist` for AsyncStorage, `devtools` for debugging

## Architecture

```
stores/
├── useAuthStore.ts           # User session, profile, tokens
├── useQueueStore.ts          # Active tickets, live board, realtime
├── useNotificationStore.ts   # Notification list, unread badge
├── useDepartmentStore.ts     # Department list, schedules, counters
└── useSettingsStore.ts       # App preferences (persisted)
```

## Store Contracts

### useAuthStore

```typescript
interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;        // Check existing session on app start
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<string>;
  setSession: (session: Session | null) => void;
  reset: () => void;
}
```

### useQueueStore

```typescript
interface QueueState {
  activeTickets: QueueTicket[];           // User's waiting/serving tickets
  liveBoard: Record<string, QueueTicket[]>; // Keyed by department_id
  currentDepartmentId: string | null;     // Currently viewing
  isLoading: boolean;

  // Actions
  fetchActiveTickets: () => Promise<void>;
  joinQueue: (departmentId: string) => Promise<QueueTicket>;
  cancelTicket: (ticketId: string) => Promise<void>;
  fetchLiveBoard: (departmentId: string) => Promise<void>;
  subscribeToDepartment: (departmentId: string) => () => void; // Returns unsubscribe fn
  subscribeToUserTickets: () => () => void;
  handleRealtimeUpdate: (payload: RealtimePayload) => void;
  reset: () => void;
}
```

### useNotificationStore

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;

  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void; // From realtime
  reset: () => void;
}
```

### useDepartmentStore

```typescript
interface DepartmentState {
  departments: Department[];
  counters: Record<string, Counter[]>;    // Keyed by department_id
  isLoading: boolean;

  // Actions
  fetchDepartments: () => Promise<void>;  // Called once on app load
  getDepartmentById: (id: string) => Department | undefined;
  getDepartmentByPrefix: (prefix: string) => Department | undefined;
  reset: () => void;
}
```

### useSettingsStore

```typescript
interface SettingsState {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'system';

  // Actions
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  reset: () => void;
}
```

This store uses Zustand's `persist` middleware with AsyncStorage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      theme: 'light',
      // ... actions
    }),
    {
      name: 'queueless-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## Usage Patterns

### Selecting state (in components)

```typescript
// Good — only re-renders when profile changes
const profile = useAuthStore((s) => s.profile);

// Good — multiple selectors via shallow comparison
import { shallow } from 'zustand/shallow';
const { activeTickets, isLoading } = useQueueStore(
  (s) => ({ activeTickets: s.activeTickets, isLoading: s.isLoading }),
  shallow
);

// Bad — re-renders on ANY store change
const everything = useAuthStore();
```

### Calling actions (in components)

```typescript
const joinQueue = useQueueStore((s) => s.joinQueue);
// Then in handler:
await joinQueue(departmentId);
```

### Accessing state outside React (in services)

```typescript
// Direct access without hooks
const userId = useAuthStore.getState().profile?.id;
useQueueStore.getState().handleRealtimeUpdate(payload);
```

### Resetting all stores on logout

```typescript
// In useAuthStore.signOut():
signOut: async () => {
  await authService.signOut();
  useAuthStore.getState().reset();
  useQueueStore.getState().reset();
  useNotificationStore.getState().reset();
  useDepartmentStore.getState().reset();
  useSettingsStore.getState().reset();
},
```

## Conventions

- One store per domain — don't merge unrelated state
- Actions live inside the store (not in separate action files)
- Async actions handle their own loading/error states
- All stores expose a `reset()` action for logout cleanup
- Use `immer` middleware only if state updates get deeply nested (start without it)
- Never store derived data — compute it in selectors or components
