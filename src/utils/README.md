# src/utils/ — Pure Utility Functions

Stateless helper functions with no side effects. These take input, return output, and don't touch stores, APIs, or the file system.

## Files

```
utils/
├── format.ts           # Display formatting (dates, ticket numbers, names)
├── queue.ts            # Queue-specific helpers (prefix lookup, status checks)
├── validation.ts       # Standalone validation helpers (not Zod schemas)
├── time.ts             # Time/date manipulation
├── text.ts             # String utilities (truncate, initials, capitalize)
└── platform.ts         # Platform-specific helpers (iOS vs Android)
```

## format.ts

```typescript
// Format ticket number for display: "A001" → "A001"
formatTicketNumber(ticket: string): string

// Format timestamp to relative: "2 mins ago", "1 hour ago", "Yesterday"
formatRelativeTime(date: string | Date): string

// Format time range: "15-20 mins"
formatWaitRange(min: number, max: number): string

// Format date for history: "Jun 3, 2026"
formatDate(date: string | Date): string

// Format time: "10:35 AM"
formatTime(date: string | Date): string

// Greet by time of day: "Good Morning", "Good Afternoon", "Good Evening"
getGreeting(): string

// Format name for display: "Joshua Rabanillo" → "Joshua"
getFirstName(fullName: string): string
```

## queue.ts

```typescript
// Get department prefix from ticket number: "A123" → "A"
getTicketPrefix(ticketNumber: string): string

// Get numeric part from ticket: "A123" → 123
getTicketSequence(ticketNumber: string): number

// Check if a ticket status is "active" (still in queue)
isActiveStatus(status: TicketStatus): boolean
// Returns true for 'waiting' | 'serving'

// Check if a ticket status is "terminal" (done)
isTerminalStatus(status: TicketStatus): boolean
// Returns true for 'completed' | 'cancelled' | 'skipped' | 'expired'

// Get display label for status
getStatusLabel(status: TicketStatus): string
// 'waiting' → 'Waiting', 'serving' → 'Now Serving', etc.

// Get status color from theme
getStatusColor(status: TicketStatus): string
```

## time.ts

```typescript
// Check if a department is currently within operating hours
isWithinOperatingHours(openTime: string, closeTime: string): boolean

// Calculate minutes between two dates
minutesBetween(start: Date, end: Date): number

// Check if a date is today
isToday(date: string | Date): boolean

// Get current day of week (0-6, Sunday = 0)
getCurrentDayOfWeek(): number
```

## text.ts

```typescript
// Get initials for avatar fallback: "Joshua Rabanillo" → "JR"
getInitials(name: string): string

// Truncate with ellipsis: "Very long text..." 
truncate(text: string, maxLength: number): string

// Capitalize first letter
capitalize(text: string): string

// Pluralize: "person" + 5 → "5 people", "minute" + 1 → "1 minute"
pluralize(word: string, count: number): string
```

## Conventions

- All functions are pure — no side effects, no store access
- Every function is individually exported (tree-shakeable)
- Use `date-fns` for date manipulation (already in dependencies)
- Keep functions small and focused — one job per function
- Add JSDoc comments for non-obvious behavior
