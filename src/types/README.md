# src/types/ — TypeScript Type Definitions

Types that aren't derived from Zod schemas. For most data shapes, prefer Zod schemas in `src/schemas/` and infer types with `z.infer<>`. This folder is for types that don't need runtime validation.

## Files

```
types/
├── errors.ts           # Custom error classes
├── navigation.ts       # Route param types for Expo Router
├── realtime.ts         # Supabase Realtime payload types
├── supabase.ts         # Auto-generated Supabase database types
└── index.ts            # Re-exports for convenience
```

## errors.ts

Typed error classes thrown by services and caught by stores.

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code, 401);
    this.name = 'AuthError';
  }
}

export class QueueError extends AppError {
  constructor(message: string, code: string = 'QUEUE_ERROR') {
    super(message, code, 400);
    this.name = 'QueueError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'No internet connection') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}
```

## navigation.ts

Type-safe route params for Expo Router's typed routes.

```typescript
export type RootParamList = {
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(tabs)/home': undefined;
  '(tabs)/services': undefined;
  '(tabs)/my-queue': undefined;
  '(tabs)/profile': undefined;
  'queue/join': { dept: string };
  'queue/[id]': { id: string };
  'settings/index': undefined;
  'settings/edit-profile': undefined;
  'notifications': undefined;
  'admin/index': undefined;
  'admin/department/[id]': { id: string };
};
```

## realtime.ts

Types for Supabase Realtime payloads.

```typescript
import type { QueueTicket } from '@/schemas/queue.schema';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T = any> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export type QueueRealtimePayload = RealtimePayload<QueueTicket>;
```

## supabase.ts

Auto-generated database types. Generate with:

```bash
supabase gen types typescript --local > src/types/supabase.ts
# or from remote:
supabase gen types typescript --project-id <ref> > src/types/supabase.ts
```

This gives you full type safety on Supabase queries:

```typescript
import { Database } from '@/types/supabase';

const supabase = createClient<Database>(url, key);
// Now .from('queue_tickets').select('*') returns typed rows
```

Re-generate this file whenever you add or modify a migration.

## Conventions

- Prefer Zod `z.infer<>` for types that also need runtime validation
- Use this folder for types that are purely compile-time (errors, navigation, realtime payloads)
- Re-export commonly used types from `index.ts` for cleaner imports
- Regenerate `supabase.ts` after every migration
