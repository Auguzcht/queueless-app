# QueueLess

> **Skip the line. Save your time.**

A mobile virtual queue management system for MMCM (Mapua Malayan Colleges Mindanao), Davao City. Students and parents can join queues, track their position in real time, and receive push notifications — all from their phone.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | Expo SDK 52+ (React Native) |
| Routing | Expo Router v4 (file-based) |
| Language | TypeScript |
| Styling | Nativewind v4 (Tailwind CSS for RN) |
| State Management | Zustand |
| Validation | Zod + React Hook Form |
| Animations | React Native Reanimated 3 |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| File Storage | Firebase Storage (profile images) |
| Push Notifications | Expo Notifications + Expo Push API |

## Departments

| Department | Prefix | Code |
|-----------|--------|------|
| Admissions | A | ADM |
| Registrar | R | REG |
| Treasury | T | TRS |
| Scholarships | S | SCH |
| Help Desk | H | HLP |

Ticket format: `[PREFIX][ZERO-PADDED-3-DIGIT]` → e.g. `A001`, `R150`, `T042`

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment file and fill in your keys
cp .env.example .env.local

# Start Supabase locally (optional)
supabase start
supabase db push
supabase db seed

# Start Expo dev server
bun start
```

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Project Structure

```
queueless/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/             # Unauthenticated screens
│   ├── (tabs)/             # Main tab navigator
│   ├── queue/              # Queue detail screens
│   ├── settings/           # Settings sub-screens
│   ├── admin/              # Staff admin panel
│   ├── _layout.tsx         # Root layout (providers, auth gate)
│   └── index.tsx           # Entry redirect
├── src/
│   ├── components/         # Reusable UI components
│   ├── stores/             # Zustand state stores
│   ├── services/           # API & business logic layer
│   ├── hooks/              # Custom React hooks
│   ├── schemas/            # Zod validation schemas
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Theme tokens, config, enums
│   ├── utils/              # Pure utility functions
│   └── lib/                # SDK clients (Supabase, Firebase)
├── assets/                 # Images, fonts, icons
├── supabase/               # Migrations, edge functions, seed
├── app.json
├── tailwind.config.js
└── package.json
```

Each folder contains its own `README.md` with detailed on-demand instructions for when you're working inside that area. Start with any folder's README before writing code in it.

## Development Phases

1. **Foundation** — Expo setup, auth flow, design system primitives
2. **Core Queue** — Join queue, live board, realtime subscriptions
3. **Notifications** — Push notifications, in-app notification history
4. **Staff Admin** — Advance queue, skip, manage counters
5. **AI & Polish** — Wait-time estimation, animations, error handling
6. **Release** — EAS builds, app icons, store submission

## Scripts

```bash
bun start          # Start Expo dev server
bun android        # Run on Android emulator
bun ios            # Run on iOS simulator
bun lint           # ESLint
bun format         # Prettier
bun type-check     # TypeScript check
```
