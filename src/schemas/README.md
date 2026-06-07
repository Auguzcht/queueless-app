# src/schemas/ — Zod Validation Schemas

Single source of truth for data shapes across the entire app. Every schema serves triple duty:

1. **React Hook Form validation** — via `@hookform/resolvers/zod`
2. **API response validation** — services parse Supabase responses through Zod before returning
3. **TypeScript types** — inferred via `z.infer<typeof schema>` so types and validation never drift apart

## Files

```
schemas/
├── auth.schema.ts              # Login, register, password reset
├── profile.schema.ts           # Profile update, profile response
├── queue.schema.ts             # Queue ticket, join queue, live board
├── notification.schema.ts      # Notification shape, paginated list
├── department.schema.ts        # Department, counter, schedule
├── admin.schema.ts             # Staff-only action inputs
└── common.schema.ts            # Shared shapes (pagination, UUID, etc.)
```

## Schema Definitions

### auth.schema.ts

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z
    .string()
    .email('Invalid email address')
    .refine(
      (email) => email.endsWith('@mcm.edu.ph'),
      'Must use your MMCM email (@mcm.edu.ph)'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  studentId: z.string().optional(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

### queue.schema.ts

```typescript
import { z } from 'zod';

export const ticketStatusEnum = z.enum([
  'waiting', 'serving', 'completed', 'skipped', 'cancelled', 'expired'
]);
export type TicketStatus = z.infer<typeof ticketStatusEnum>;

export const queueTicketSchema = z.object({
  id: z.string().uuid(),
  ticket_number: z.string().regex(/^[ARTSH]\d{3}$/, 'Invalid ticket format'),
  department_id: z.string().uuid(),
  user_id: z.string().uuid(),
  counter_id: z.string().uuid().nullable(),
  status: ticketStatusEnum,
  position: z.number().int().positive(),
  joined_at: z.string().datetime(),
  called_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  cancelled_at: z.string().datetime().nullable(),
  skipped_at: z.string().datetime().nullable(),
  expired_at: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  date: z.string(), // 'YYYY-MM-DD'
});
export type QueueTicket = z.infer<typeof queueTicketSchema>;

export const joinQueueSchema = z.object({
  departmentId: z.string().uuid('Invalid department'),
});
export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
```

### profile.schema.ts

```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  display_name: z.string().max(50).optional(),
  phone: z.string().regex(/^09\d{9}$/, 'Must be a valid PH mobile number').optional(),
  student_id: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  display_name: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(['student', 'parent', 'staff', 'admin']),
  student_id: z.string().nullable(),
  is_verified: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof profileSchema>;
```

### department.schema.ts

```typescript
import { z } from 'zod';

export const departmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  prefix: z.string().length(1),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  is_active: z.boolean(),
  display_order: z.number(),
});
export type Department = z.infer<typeof departmentSchema>;

export const counterSchema = z.object({
  id: z.string().uuid(),
  department_id: z.string().uuid(),
  counter_number: z.number(),
  label: z.string().nullable(),
  is_active: z.boolean(),
});
export type Counter = z.infer<typeof counterSchema>;
```

### common.schema.ts

```typescript
import { z } from 'zod';

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    count: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });

export const uuidSchema = z.string().uuid();
```

## Usage in React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/schemas/auth.schema';

const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
  resolver: zodResolver(registerSchema),
});
```

## Usage in Services

```typescript
import { queueTicketSchema } from '@/schemas/queue.schema';

const { data, error } = await supabase.from('queue_tickets').select('*').eq('id', ticketId).single();
if (error) throw new QueueError(error.message, 'FETCH_FAILED');

// Validate response shape — throws ZodError if invalid
const ticket = queueTicketSchema.parse(data);
return ticket;
```

## Conventions

- File naming: `domain.schema.ts`
- Always export both the Zod schema AND the inferred type
- Schema names are camelCase: `queueTicketSchema`
- Type names are PascalCase: `QueueTicket`
- Input schemas (for forms) end with `Input`: `RegisterInput`
- Response schemas (from API) match the table name: `profileSchema`
- Use `.refine()` for cross-field validation (password confirmation, date ranges)
- Use `.transform()` sparingly — prefer keeping raw shapes clean
