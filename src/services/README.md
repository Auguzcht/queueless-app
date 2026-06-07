# src/services/ — API & Business Logic Layer

The service layer sits between Zustand stores and Supabase/Firebase SDKs. **Stores never call Supabase directly** — they go through services. This keeps API logic isolated, testable, and swappable.

## Architecture

```
Component → Store (action) → Service → Supabase/Firebase
                                ↕
                          Zod validation
```

Every service function:
1. Validates inputs with Zod (if applicable)
2. Calls Supabase or Firebase
3. Validates the response with Zod
4. Returns typed data or throws a typed error

## Files

```
services/
├── auth.service.ts           # Authentication operations
├── queue.service.ts          # Queue join, cancel, live board, history
├── notification.service.ts   # Push token registration, notification CRUD
├── department.service.ts     # Department + counter + schedule queries
├── profile.service.ts        # Profile CRUD + avatar upload
├── waittime.service.ts       # Wait time estimation
└── admin.service.ts          # Staff-only operations (advance, skip)
```

## Service Contracts

### auth.service.ts

```typescript
// Sign in with email and password
signIn(email: string, password: string): Promise<Session>

// Register a new account (validates @mcm.edu.ph domain via Zod)
signUp(data: RegisterInput): Promise<Session>

// Sign out and clear session
signOut(): Promise<void>

// Send password reset email
resetPassword(email: string): Promise<void>

// Get current session (from storage/memory)
getSession(): Promise<Session | null>

// Listen for auth state changes (login, logout, token refresh)
onAuthStateChange(callback: (session: Session | null) => void): Subscription
```

### queue.service.ts

```typescript
// Join a queue — calls the generate-ticket edge function
joinQueue(departmentId: string): Promise<QueueTicket>

// Cancel a waiting ticket
cancelTicket(ticketId: string): Promise<void>

// Fetch user's active (waiting/serving) tickets for today
getActiveTickets(userId: string): Promise<QueueTicket[]>

// Fetch today's live board for a department (waiting + serving, ordered)
getLiveBoard(departmentId: string): Promise<QueueTicket[]>

// Fetch ticket detail with department and counter info
getTicketDetail(ticketId: string): Promise<QueueTicketDetail>

// Paginated queue history for a user
getQueueHistory(userId: string, page: number): Promise<PaginatedResult<QueueTicket>>

// Get people ahead count for a specific ticket
getPositionAhead(ticketId: string): Promise<number>
```

### notification.service.ts

```typescript
// Register or update an Expo push token
registerPushToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void>

// Deactivate a push token (on logout)
deactivatePushToken(token: string): Promise<void>

// Fetch paginated notifications
getNotifications(userId: string, page: number): Promise<PaginatedResult<Notification>>

// Get unread count (for badge)
getUnreadCount(userId: string): Promise<number>

// Mark a single notification as read
markAsRead(notificationId: string): Promise<void>

// Mark all notifications as read
markAllAsRead(userId: string): Promise<void>
```

### department.service.ts

```typescript
// Fetch all departments with counters and today's schedule
getAllDepartments(): Promise<DepartmentWithDetails[]>

// Get department status: now serving, waiting count, estimated wait
getDepartmentStatus(departmentId: string): Promise<DepartmentStatus>

// Check if a department is currently open
isDepartmentOpen(departmentId: string): Promise<boolean>
```

### profile.service.ts

```typescript
// Fetch a user's profile
getProfile(userId: string): Promise<Profile>

// Update profile fields
updateProfile(userId: string, data: UpdateProfileInput): Promise<Profile>

// Upload avatar to Firebase Storage and update profile.avatar_url
uploadAvatar(userId: string, imageUri: string): Promise<string>

// Delete avatar from Firebase Storage and clear profile.avatar_url
deleteAvatar(userId: string): Promise<void>
```

### waittime.service.ts

```typescript
// Get estimated wait time for a department
estimateWait(departmentId: string): Promise<WaitTimeEstimate>
// Returns: { min_minutes: number, max_minutes: number, people_ahead: number }

// Get historical wait stats (for analytics display)
getWaitStats(departmentId: string, days: number): Promise<WaitTimeStat[]>
```

### admin.service.ts

```typescript
// Advance to next person in queue (staff only)
advanceQueue(departmentId: string, counterId: string): Promise<QueueTicket | null>

// Skip a specific ticket (staff only)
skipTicket(ticketId: string): Promise<void>

// Recall a skipped ticket back to waiting (staff only)
recallTicket(ticketId: string): Promise<void>

// Get department dashboard data (staff only)
getDepartmentDashboard(departmentId: string): Promise<DepartmentDashboard>
```

## Error Handling

Services throw typed errors defined in `src/types/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
  }
}

export class AuthError extends AppError { ... }
export class QueueError extends AppError { ... }
export class ValidationError extends AppError { ... }
export class NetworkError extends AppError { ... }
```

Stores catch these and set error state for the UI to display.

## Example Implementation Pattern

```typescript
// queue.service.ts
import { supabase } from '@/lib/supabase';
import { queueTicketSchema } from '@/schemas/queue.schema';
import { QueueError } from '@/types/errors';

export async function joinQueue(departmentId: string) {
  // 1. Call edge function
  const { data, error } = await supabase.functions.invoke('generate-ticket', {
    body: { department_id: departmentId },
  });

  if (error) {
    throw new QueueError(
      error.message || 'Failed to join queue',
      'QUEUE_JOIN_FAILED'
    );
  }

  // 2. Validate response shape with Zod
  const ticket = queueTicketSchema.parse(data);

  return ticket;
}
```

## Conventions

- File naming: `domain.service.ts` (lowercase, dot-separated)
- All functions are named exports (not default)
- Every Supabase response is Zod-validated before returning
- Never import stores into services (avoids circular deps) — if a service needs user info, accept it as a parameter
- Keep services stateless — they're pure request/response functions
