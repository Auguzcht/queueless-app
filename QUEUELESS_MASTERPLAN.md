# QueueLess — Masterplan

> **Version**: 1.0.0-prototype
> **Client**: MMCM (Mapua Malayan Colleges Mindanao), Davao City
> **Purpose**: Mobile virtual queue management for campus public-facing offices
> **Target**: Android + iOS via single Expo codebase

---

## Table of Contents

1. [Problem Statement & Scope](#1-problem-statement--scope)
2. [Assumptions & Constraints](#2-assumptions--constraints)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Design System](#5-design-system)
6. [Supabase Schema](#6-supabase-schema)
7. [Auth Strategy](#7-auth-strategy)
8. [Realtime & Push Notifications](#8-realtime--push-notifications)
9. [State Management](#9-state-management)
10. [AI Wait-Time Forecasting](#10-ai-wait-time-forecasting)
11. [File Structure & Per-Folder READMEs](#11-file-structure--per-folder-readmes)
12. [Screen Inventory](#12-screen-inventory)
13. [Development Phases](#13-development-phases)
14. [Environment Setup](#14-environment-setup)

---

## 1. Problem Statement & Scope

MMCM is undergoing retrofitting. Students and parents currently cram into a makeshift guardhouse area to access five public-facing offices — **Admissions (A)**, **Registrar (R)**, **Treasury (T)**, **Scholarships (S)**, and **Help Desk (H)**. Each office has a physical ticket printer and a TV display showing the current serving number (prefix + sequential number, e.g. A90, T45, R150).

**The gap**: There is no way to check queue status remotely. You must be physically present to see the TV screen.

**QueueLess** provides a mobile platform that mirrors and extends the physical queue — letting users join queues, track their position, get push notifications when their turn approaches, and view live queue status for all departments from anywhere on (or off) campus.

### In-Scope (Prototype)

- Student/parent mobile app (Android + iOS)
- Virtual queue joining per department
- Live queue board mirroring the physical display
- Push notifications for queue status changes
- Queue history and user profile
- Staff admin panel (lightweight — for triggering "next" and managing queues)
- AI-based wait-time estimation (basic model, improves with data)

### Out-of-Scope (Prototype)

- Physical hardware integration (webhook bridge to ticket printers/TV systems)
- Microsoft OAuth via MMCM org admin (no access)
- Payment processing
- Appointment booking (future phase)

### Prototype Assumption

Since we cannot yet integrate with the physical queue hardware, the prototype operates as a **parallel digital queue system**. A lightweight staff-facing admin interface allows office personnel to advance queues manually (simulating what the physical button does on the TV). This proves the concept so the school can evaluate before committing to hardware integration.

---

## 2. Assumptions & Constraints

| # | Assumption | Implication |
|---|-----------|-------------|
| 1 | No Microsoft OAuth access for @mcm.edu.ph | Email + password auth with domain validation |
| 2 | No hardware integration yet | Staff admin panel simulates queue advancement |
| 3 | Single codebase for Android + iOS | Expo with Expo Router |
| 4 | Minimal backend | Supabase handles auth, DB, realtime; Firebase for image storage |
| 5 | Queue prefixes are fixed | A (Admissions), R (Registrar), T (Treasury), S (Scholarships), H (Help Desk) |
| 6 | Operating hours are weekdays only | Queue resets daily; numbering restarts each day |
| 7 | One active queue per user per department | Prevents ticket hoarding |
| 8 | Users must arrive within 5 minutes of being called | Auto-skip after grace period |

---

## 3. Tech Stack

### Mobile App (Client)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Expo SDK 52+** (managed workflow) | Single codebase → Android + iOS; OTA updates; managed native modules |
| Routing | **Expo Router v4** (file-based) | Familiar to React Router / Next.js devs; deep linking out of the box |
| Language | **TypeScript** | Type safety across the entire codebase |
| Styling | **Nativewind v4** (Tailwind for RN) | Utility-first, consistent with web Tailwind muscle memory |
| State | **Zustand** | Minimal boilerplate, works great with React Native; no provider wrappers |
| Validation | **Zod** | Runtime schema validation for forms, API responses, env vars |
| Forms | **React Hook Form + Zod resolver** | Performant form handling with schema-based validation |
| Animations | **React Native Reanimated 3** | 60fps native-thread animations for queue transitions, page enters |
| Icons | **Lucide React Native** or **@expo/vector-icons** | Consistent icon library |
| Push | **expo-notifications** | Managed push notification handling for both platforms |

### Backend & Infrastructure

| Layer | Technology | Why |
|-------|-----------|-----|
| Database | **Supabase (PostgreSQL)** | Hosted Postgres, row-level security, realtime subscriptions |
| Auth | **Supabase Auth** | Email/password with custom domain validation |
| Realtime | **Supabase Realtime** | Postgres changes → live queue updates to all connected clients |
| File Storage | **Firebase Storage** | Profile image uploads (Supabase Storage is an alternative but Firebase has better RN SDK support for resumable uploads) |
| Edge Functions | **Supabase Edge Functions** (Deno) | Queue number generation, wait-time calculations, notification dispatch |
| Push Service | **Expo Push API** | Managed push notification delivery |

### Dev Tooling

| Tool | Purpose |
|------|---------|
| **Bun** or **pnpm** | Fast package manager |
| **ESLint + Prettier** | Code quality |
| **Husky + lint-staged** | Pre-commit hooks |
| **EAS Build** | Cloud builds for iOS/Android |
| **EAS Submit** | App store submission |
| **Expo Dev Client** | Custom dev builds for native module testing |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP (Expo)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Screens │  │  Zustand  │  │   Zod    │  │ RHF    │  │
│  │  (Router)│  │  Stores   │  │ Schemas  │  │ Forms  │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └────────┘  │
│       │              │                                   │
│  ┌────▼──────────────▼──────────────────────────────┐   │
│  │            Service Layer (src/services/)          │   │
│  │  ┌────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Queue  │  │   Auth   │  │  Notifications   │  │   │
│  │  │Service │  │  Service │  │    Service        │  │   │
│  │  └───┬────┘  └────┬─────┘  └────────┬─────────┘  │   │
│  └──────┼────────────┼──────────────────┼────────────┘   │
└─────────┼────────────┼──────────────────┼────────────────┘
          │            │                  │
          ▼            ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE                               │
│                                                           │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Auth    │  │  PostgreSQL  │  │  Realtime           │  │
│  │  (email) │  │  (+ RLS)     │  │  (queue changes)    │  │
│  └──────────┘  └──────────────┘  └────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────┐                         │
│  │  Edge Functions              │                         │
│  │  - generate_ticket_number    │                         │
│  │  - advance_queue             │                         │
│  │  - estimate_wait_time        │                         │
│  │  - send_push_notification    │                         │
│  └──────────────────────────────┘                         │
└───────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────┐    ┌─────────────────────┐
│  Firebase Storage    │    │  Expo Push API       │
│  (profile images)    │    │  (notification relay) │
└──────────────────────┘    └─────────────────────┘
```

### Data Flow: User Joins Queue

```
1. User selects department → taps "Join Queue"
2. App calls Supabase Edge Function `generate_ticket_number`
3. Edge Function:
   a. Checks user doesn't already have active ticket for this dept
   b. Gets today's next sequence number for the department prefix
   c. Inserts row into `queue_tickets` table
   d. Returns ticket number (e.g. "A123")
4. Supabase Realtime broadcasts INSERT to all subscribers
5. Live Queue board updates on all connected devices
6. User sees their ticket on "My Queue" screen
```

### Data Flow: Staff Advances Queue

```
1. Staff taps "Next" on admin panel for their department
2. Edge Function `advance_queue`:
   a. Marks current ticket as "completed" or "skipped"
   b. Pulls next ticket in line → marks as "serving"
   c. Logs transaction duration for AI training data
3. Realtime broadcasts UPDATE to all subscribers
4. Push notification sent to the next-in-line user
5. "Almost your turn" notification sent to user N+2
```

---

## 5. Design System

### 5.1 Color Palette

Derived from the provided brand palette, adapted for accessibility:

```
─────────────────────────────────────────────────────
Token               Hex        Usage
─────────────────────────────────────────────────────
--color-primary     #004E98    Headers, CTAs, nav, branding (Steel Azure)
--color-primary-light #3A6EA5  Active states, links, lighter accent (Cornflower Ocean)
--color-accent      #FF6700    Attention, badges, important actions (Pumpkin Spice)
--color-bg-primary  #FFFFFF    Main background
--color-bg-secondary #F5F7FA   Cards, sections (slightly cooler than #EBEBEB)
--color-bg-tertiary #EBEBEB    Dividers, disabled backgrounds (Platinum)
--color-border      #E2E8F0    Card borders, input outlines
--color-text-primary #1A1A2E   Headings, body text
--color-text-secondary #6B7280 Subtitles, labels, timestamps
--color-text-muted  #9CA3AF    Placeholder text, disabled labels
--color-success     #22C55E    Active badge, completed status
--color-warning     #F59E0B    Warning banners, "almost your turn"
--color-error       #EF4444    Cancel button, error states, cancelled badge
--color-surface     #FFFFFF    Elevated cards (with shadow)
─────────────────────────────────────────────────────
```

### 5.2 Typography

**Font Family**: `Inter` for body (ships with Expo, highly legible at small sizes on mobile) + `Plus Jakarta Sans` for headings and display text (geometric, modern, distinctive).

We load custom fonts via `expo-font`:

```
─────────────────────────────────────────────────────
Role             Font                    Size    Weight    Line Height
─────────────────────────────────────────────────────
Display          Plus Jakarta Sans       32px    800       1.1
H1               Plus Jakarta Sans       28px    700       1.2
H2               Plus Jakarta Sans       22px    700       1.3
H3               Plus Jakarta Sans       18px    600       1.4
Body Large       Inter                   16px    400       1.5
Body             Inter                   14px    400       1.5
Body Small       Inter                   12px    400       1.4
Caption          Inter                   11px    500       1.3
Label            Inter                   13px    600       1.2
Button           Plus Jakarta Sans       15px    600       1.0
Queue Number     Plus Jakarta Sans       48px    800       1.0
─────────────────────────────────────────────────────
```

### 5.3 Spacing Scale

8px base grid system:

```
--space-xs:   4px
--space-sm:   8px
--space-md:   12px
--space-lg:   16px
--space-xl:   24px
--space-2xl:  32px
--space-3xl:  48px
--space-4xl:  64px
```

### 5.4 Corner Radii

```
--radius-sm:   8px    (buttons, inputs, small cards)
--radius-md:   12px   (cards, modals)
--radius-lg:   16px   (bottom sheets, large cards)
--radius-xl:   24px   (floating action areas)
--radius-full: 9999px (avatars, badges, pills)
```

### 5.5 Elevation / Shadows

```
--shadow-sm:   0 1px 2px rgba(0,0,0,0.05)
--shadow-md:   0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)
--shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
```

### 5.6 Motion Principles

All animations use React Native Reanimated 3 (runs on the UI thread for 60fps):

| Interaction | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Screen enter | Slide up + fade in | 300ms | `Easing.out(Easing.cubic)` |
| Card appear | Scale from 0.95 + fade | 200ms | `Easing.out(Easing.quad)` |
| Queue number change | Count-up / shimmer | 400ms | Spring (damping: 15) |
| Status badge change | Color morph + pulse | 250ms | `Easing.inOut(Easing.ease)` |
| Pull to refresh | Overscroll bounce | Native | Native |
| Tab switch | Cross-fade | 200ms | `Easing.ease` |
| Notification toast | Slide down from top + fade | 300ms | Spring (damping: 20) |
| Button press | Scale to 0.97 | 100ms | `Easing.out(Easing.quad)` |

### 5.7 Component Design Patterns

**Cards**: White surface, `shadow-card`, `radius-md`, 16px internal padding. Slight left border accent for status indication (blue = active, green = completed, red = cancelled).

**Buttons**:
- Primary: `#004E98` bg, white text, `radius-sm`, 48px min height
- Secondary: White bg, `#004E98` border + text, `radius-sm`
- Destructive: `#EF4444` bg, white text
- Ghost: Transparent bg, `#3A6EA5` text

**Status Badges**: Pill-shaped (`radius-full`), small text, background color at 15% opacity with full-opacity text:
- Active: green
- Waiting: blue
- Serving: orange/accent
- Completed: gray
- Cancelled: red

**Header Gradient**: The home screen uses a gradient from `#004E98` → `#3A6EA5` (top to bottom) as the hero/greeting area, matching the mockups.

**Bottom Navigation**: 4 tabs — Home, Services, My Queue, Profile. Active tab uses `--color-primary` with filled icon; inactive uses `--color-text-secondary` with outline icon.

---

## 6. Supabase Schema

### 6.1 Entity Relationship Diagram

```
profiles ──────┐
               │ 1:N
               ├──── queue_tickets ────── departments
               │         │ 1:1                │ 1:N
               │         └── ticket_logs       ├──── counters
               │                               │
               ├──── push_tokens               └──── department_schedules
               │
               └──── notifications
```

### 6.2 SQL Schema

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'parent', 'staff', 'admin');
CREATE TYPE ticket_status AS ENUM ('waiting', 'serving', 'completed', 'skipped', 'cancelled', 'expired');
CREATE TYPE notification_type AS ENUM (
  'queue_joined',
  'almost_your_turn',
  'your_turn',
  'queue_completed',
  'queue_cancelled',
  'queue_skipped',
  'system_announcement'
);

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with app-specific data
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  display_name    TEXT,
  phone           TEXT,
  avatar_url      TEXT,              -- Firebase Storage URL
  role            user_role NOT NULL DEFAULT 'student',
  student_id      TEXT,              -- MMCM student ID (nullable for parents)
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email domain queries
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- DEPARTMENTS
-- The 5 campus offices (seeded, not user-created)
-- ============================================================
CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL UNIQUE,           -- 'Admissions', 'Registrar', etc.
  code            TEXT NOT NULL UNIQUE,           -- 'ADM', 'REG', 'TRS', 'SCH', 'HLP'
  prefix          CHAR(1) NOT NULL UNIQUE,        -- 'A', 'R', 'T', 'S', 'H'
  description     TEXT,
  icon            TEXT,                            -- icon name from lucide set
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COUNTERS
-- Physical counter windows within each department
-- ============================================================
CREATE TABLE counters (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  counter_number  INT NOT NULL,                   -- Counter 1, Counter 2, etc.
  label           TEXT,                            -- Optional label like "New Students Only"
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(department_id, counter_number)
);

CREATE INDEX idx_counters_dept ON counters(department_id);

-- ============================================================
-- DEPARTMENT SCHEDULES
-- Operating hours per day of week
-- ============================================================
CREATE TABLE department_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  open_time       TIME NOT NULL DEFAULT '08:00',
  close_time      TIME NOT NULL DEFAULT '17:00',
  is_open         BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE(department_id, day_of_week)
);

-- ============================================================
-- DAILY SEQUENCES
-- Tracks the current ticket number per department per day
-- Resets each day automatically
-- ============================================================
CREATE TABLE daily_sequences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  last_number     INT NOT NULL DEFAULT 0,

  UNIQUE(department_id, date)
);

CREATE INDEX idx_daily_seq_dept_date ON daily_sequences(department_id, date);

-- ============================================================
-- QUEUE TICKETS
-- The core table — one row per person per queue entry
-- ============================================================
CREATE TABLE queue_tickets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number   TEXT NOT NULL,                   -- 'A123', 'R045', etc.
  department_id   UUID NOT NULL REFERENCES departments(id),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  counter_id      UUID REFERENCES counters(id),    -- assigned when serving
  status          ticket_status NOT NULL DEFAULT 'waiting',
  position        INT NOT NULL,                    -- position when issued (for ordering)
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at       TIMESTAMPTZ,                     -- when status → serving
  completed_at    TIMESTAMPTZ,                     -- when status → completed
  cancelled_at    TIMESTAMPTZ,
  skipped_at      TIMESTAMPTZ,
  expired_at      TIMESTAMPTZ,
  notes           TEXT,                            -- optional staff notes
  date            DATE NOT NULL DEFAULT CURRENT_DATE,

  -- A user can only have ONE active ticket per department at a time
  -- (active = waiting or serving)
  CONSTRAINT unique_active_ticket UNIQUE (user_id, department_id, date, status)
    -- Note: this constraint is enforced via trigger instead, see below
);

CREATE INDEX idx_tickets_dept_date ON queue_tickets(department_id, date);
CREATE INDEX idx_tickets_user ON queue_tickets(user_id);
CREATE INDEX idx_tickets_status ON queue_tickets(status);
CREATE INDEX idx_tickets_dept_status ON queue_tickets(department_id, status, position);
CREATE INDEX idx_tickets_date ON queue_tickets(date);

-- ============================================================
-- TICKET LOGS
-- Audit trail for every status change (also feeds AI model)
-- ============================================================
CREATE TABLE ticket_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       UUID NOT NULL REFERENCES queue_tickets(id) ON DELETE CASCADE,
  previous_status ticket_status,
  new_status      ticket_status NOT NULL,
  changed_by      UUID REFERENCES profiles(id),    -- staff who made the change
  counter_id      UUID REFERENCES counters(id),
  duration_seconds INT,                             -- time spent in previous status
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_logs_ticket ON ticket_logs(ticket_id);
CREATE INDEX idx_ticket_logs_created ON ticket_logs(created_at);

-- ============================================================
-- NOTIFICATIONS
-- In-app notification history
-- ============================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,                           -- arbitrary payload (ticket_id, etc.)
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================================
-- PUSH TOKENS
-- Expo push tokens for each device
-- ============================================================
CREATE TABLE push_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

-- ============================================================
-- WAIT TIME STATS
-- Aggregated data for AI forecasting
-- ============================================================
CREATE TABLE wait_time_stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id   UUID NOT NULL REFERENCES departments(id),
  date            DATE NOT NULL,
  hour            INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  avg_wait_seconds    NUMERIC NOT NULL DEFAULT 0,
  avg_service_seconds NUMERIC NOT NULL DEFAULT 0,
  total_served    INT NOT NULL DEFAULT 0,
  total_cancelled INT NOT NULL DEFAULT 0,
  total_skipped   INT NOT NULL DEFAULT 0,
  peak_queue_length INT NOT NULL DEFAULT 0,

  UNIQUE(department_id, date, hour)
);

CREATE INDEX idx_wait_stats_dept ON wait_time_stats(department_id, date);

-- ============================================================
-- SYSTEM ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  department_id   UUID REFERENCES departments(id), -- null = all departments
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles: public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: self update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: self insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Departments: public read
CREATE POLICY "Departments: public read" ON departments FOR SELECT USING (true);

-- Counters: public read
CREATE POLICY "Counters: public read" ON counters FOR SELECT USING (true);

-- Queue Tickets: users read own + all for live board; staff can update
CREATE POLICY "Tickets: read own" ON queue_tickets
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Tickets: read live board" ON queue_tickets
  FOR SELECT USING (date = CURRENT_DATE AND status IN ('waiting', 'serving'));
CREATE POLICY "Tickets: self insert" ON queue_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Tickets: self cancel" ON queue_tickets
  FOR UPDATE USING (user_id = auth.uid() AND status = 'waiting');
CREATE POLICY "Tickets: staff update" ON queue_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Notifications: users read own only
CREATE POLICY "Notifications: read own" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Notifications: update own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Push Tokens: users manage own
CREATE POLICY "Push tokens: manage own" ON push_tokens
  FOR ALL USING (user_id = auth.uid());

-- Ticket Logs: staff + own ticket
CREATE POLICY "Logs: read own ticket" ON ticket_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM queue_tickets
      WHERE queue_tickets.id = ticket_logs.ticket_id
      AND queue_tickets.user_id = auth.uid()
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enforce single active ticket per user per department
CREATE OR REPLACE FUNCTION check_active_ticket()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('waiting', 'serving') THEN
    IF EXISTS (
      SELECT 1 FROM queue_tickets
      WHERE user_id = NEW.user_id
        AND department_id = NEW.department_id
        AND date = CURRENT_DATE
        AND status IN ('waiting', 'serving')
        AND id != COALESCE(NEW.id, uuid_generate_v4())
    ) THEN
      RAISE EXCEPTION 'User already has an active ticket for this department today';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_active_ticket
  BEFORE INSERT OR UPDATE ON queue_tickets
  FOR EACH ROW EXECUTE FUNCTION check_active_ticket();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA (Departments + Counters)
-- ============================================================

INSERT INTO departments (name, code, prefix, description, icon, display_order) VALUES
  ('Admissions',   'ADM', 'A', 'New student enrollment',    'graduation-cap', 1),
  ('Registrar',    'REG', 'R', 'Records and documents',     'file-text',      2),
  ('Treasury',     'TRS', 'T', 'Payments and fees',         'landmark',       3),
  ('Scholarships', 'SCH', 'S', 'Financial assistance',      'dollar-sign',    4),
  ('Help Desk',    'HLP', 'H', 'General inquiries',         'help-circle',    5);

-- Seed counters (2 per department as default)
INSERT INTO counters (department_id, counter_number, label)
SELECT d.id, n, 'Counter ' || n
FROM departments d
CROSS JOIN generate_series(1, 2) AS n;

-- Seed weekday schedules (Mon-Fri open, Sat-Sun closed)
INSERT INTO department_schedules (department_id, day_of_week, is_open)
SELECT d.id, dow,
  CASE WHEN dow BETWEEN 1 AND 5 THEN TRUE ELSE FALSE END
FROM departments d
CROSS JOIN generate_series(0, 6) AS dow;
```

### 6.3 Supabase Realtime Configuration

Enable Realtime on these tables (via Supabase Dashboard → Database → Replication):

- `queue_tickets` — broadcasts INSERT, UPDATE for live queue board
- `notifications` — broadcasts INSERT for in-app notification badge
- `announcements` — broadcasts INSERT, UPDATE for system-wide alerts

Client subscription example:

```typescript
// Subscribe to queue changes for a department
supabase
  .channel('live-queue-admissions')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'queue_tickets',
      filter: `department_id=eq.${deptId}`,
    },
    (payload) => {
      // Update Zustand store
      useQueueStore.getState().handleRealtimeUpdate(payload);
    }
  )
  .subscribe();
```

---

## 7. Auth Strategy

Since we have no Microsoft OAuth access for `@mcm.edu.ph`:

### Flow

1. **Registration**: User provides full name, email, password, student ID (optional)
2. **Domain Validation**: Zod schema enforces `@mcm.edu.ph` suffix on email
3. **Email Verification**: Supabase sends magic-link / OTP to their MCM email
4. **Profile Completion**: After verification, user completes profile (avatar, phone)
5. **Manual Approval** (optional): Admin can flag accounts for verification against enrollment records

### Zod Schema for Registration

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100),
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
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  studentId: z.string().optional(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);
```

### Parent Accounts

Parents use personal emails. Registration requires:
- Full name
- Personal email (any domain)
- Relationship to student
- Student's ID number (for linking)

Staff accounts are created by admins only (seeded or via admin panel).

---

## 8. Realtime & Push Notifications

### Expo Push Notifications Setup

```typescript
// src/services/notifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // no push on simulator

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('queue-updates', {
      name: 'Queue Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#004E98',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id',
  });

  return token.data;
}
```

### Notification Triggers

| Event | Title | Body | When |
|-------|-------|------|------|
| Queue Joined | "You're in line!" | "Your number is A123. 12 people ahead." | On ticket creation |
| Almost Your Turn | "Almost your turn!" | "Get ready. A123 will be called soon." | When 2 people ahead |
| Your Turn | "Your turn!" | "Please proceed to Counter 2." | Status → serving |
| Completed | "Thank you!" | "You have been served. We hope to see you again." | Status → completed |
| Skipped | "You were skipped" | "You missed your turn. Tap to rejoin." | Status → skipped |
| Cancelled | "Queue cancelled" | "Your queue A123 has been cancelled." | Status → cancelled |

---

## 9. State Management

### Zustand + Zod Architecture

Zustand stores are thin, co-located with their domain. Zod validates all external data before it enters stores.

```
src/stores/
├── useAuthStore.ts        — user session, profile, tokens
├── useQueueStore.ts       — active tickets, live queue data, realtime subs
├── useNotificationStore.ts — notification list, unread count, badge
├── useDepartmentStore.ts  — department list, schedules, counters
└── useSettingsStore.ts    — app preferences (notification on/off, theme)
```

### Example: Queue Store

```typescript
import { create } from 'zustand';
import { z } from 'zod';

// Zod schema for runtime validation
const QueueTicketSchema = z.object({
  id: z.string().uuid(),
  ticket_number: z.string(),
  department_id: z.string().uuid(),
  status: z.enum(['waiting', 'serving', 'completed', 'skipped', 'cancelled', 'expired']),
  position: z.number(),
  joined_at: z.string(),
  called_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

type QueueTicket = z.infer<typeof QueueTicketSchema>;

interface QueueState {
  activeTickets: QueueTicket[];
  liveBoard: Record<string, QueueTicket[]>; // keyed by department_id
  isLoading: boolean;

  // Actions
  fetchActiveTickets: () => Promise<void>;
  joinQueue: (departmentId: string) => Promise<QueueTicket>;
  cancelTicket: (ticketId: string) => Promise<void>;
  subscribeToDepartment: (departmentId: string) => void;
  handleRealtimeUpdate: (payload: any) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  activeTickets: [],
  liveBoard: {},
  isLoading: false,
  // ... implementations
}));
```

### Why Zustand + Zod

- **Zustand**: No providers, no context, no boilerplate. Works outside React (in services). Tiny bundle. Subscriptions are selector-based so components only re-render on the slice they use.
- **Zod**: Validates Supabase responses at the boundary (service layer) so invalid data never reaches stores or UI. Also powers React Hook Form validation for all user inputs. Single source of truth for shape definitions.
- **React Hook Form**: Uncontrolled inputs = minimal re-renders on mobile. Zod resolver means form validation and API validation use the same schemas.

---

## 10. AI Wait-Time Forecasting

### Strategy

Phase 1 (Prototype): Simple arithmetic average based on `wait_time_stats`.

```
estimated_wait = (avg_service_seconds_per_ticket × people_ahead) + buffer
```

Phase 2 (With Data): Time-series model using:
- Historical `wait_time_stats` (avg per department, per hour, per day-of-week)
- Current queue length
- Number of active counters
- Day-of-week and time-of-day patterns
- Enrollment period flags (peak seasons)

Phase 3 (Production): Edge function calls a lightweight ML model (could be a Supabase Edge Function calling an external inference endpoint) trained on `ticket_logs` duration data.

### Data Collection

Every ticket status transition is logged in `ticket_logs` with `duration_seconds`. An hourly cron (Supabase pg_cron) aggregates this into `wait_time_stats`:

```sql
-- Hourly aggregation (runs via pg_cron)
INSERT INTO wait_time_stats (department_id, date, hour, day_of_week,
  avg_wait_seconds, avg_service_seconds, total_served, total_cancelled, total_skipped, peak_queue_length)
SELECT
  department_id,
  CURRENT_DATE,
  EXTRACT(HOUR FROM NOW())::INT,
  EXTRACT(DOW FROM NOW())::INT,
  AVG(EXTRACT(EPOCH FROM (called_at - joined_at))) FILTER (WHERE called_at IS NOT NULL),
  AVG(EXTRACT(EPOCH FROM (completed_at - called_at))) FILTER (WHERE completed_at IS NOT NULL),
  COUNT(*) FILTER (WHERE status = 'completed'),
  COUNT(*) FILTER (WHERE status = 'cancelled'),
  COUNT(*) FILTER (WHERE status = 'skipped'),
  MAX(position)
FROM queue_tickets
WHERE date = CURRENT_DATE
  AND EXTRACT(HOUR FROM joined_at) = EXTRACT(HOUR FROM NOW())
GROUP BY department_id
ON CONFLICT (department_id, date, hour)
DO UPDATE SET
  avg_wait_seconds = EXCLUDED.avg_wait_seconds,
  avg_service_seconds = EXCLUDED.avg_service_seconds,
  total_served = EXCLUDED.total_served,
  total_cancelled = EXCLUDED.total_cancelled,
  total_skipped = EXCLUDED.total_skipped,
  peak_queue_length = EXCLUDED.peak_queue_length;
```

---

## 11. File Structure & Per-Folder READMEs

### Root Structure

```
queueless/
├── app/                          # Expo Router — file-based routing
│   ├── (auth)/                   # Auth screens (unauthenticated group)
│   ├── (tabs)/                   # Main tab navigator (authenticated)
│   ├── queue/                    # Queue-related screens
│   ├── settings/                 # Settings sub-screens
│   ├── admin/                    # Staff admin panel
│   ├── _layout.tsx               # Root layout (providers, auth gate)
│   └── index.tsx                 # Entry redirect
│
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Design system primitives
│   │   ├── queue/                # Queue-specific components
│   │   ├── auth/                 # Auth form components
│   │   ├── home/                 # Home screen sections
│   │   └── layout/               # Shared layout pieces
│   │
│   ├── stores/                   # Zustand state stores
│   ├── services/                 # API + business logic layer
│   ├── hooks/                    # Custom React hooks
│   ├── schemas/                  # Zod validation schemas
│   ├── types/                    # TypeScript type definitions
│   ├── constants/                # Theme tokens, config, enums
│   ├── utils/                    # Pure utility functions
│   └── lib/                      # SDK clients (Supabase, Firebase)
│
├── assets/
│   ├── images/                   # Static images, logo, illustrations
│   ├── fonts/                    # Custom font files
│   └── icons/                    # Custom icon SVGs (if any)
│
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── generate-ticket/
│   │   ├── advance-queue/
│   │   ├── estimate-wait/
│   │   └── send-notification/
│   └── seed.sql                  # Department + counter seed data
│
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tailwind.config.js            # Nativewind config
├── tsconfig.json
├── .env.example
├── .eslintrc.js
├── .prettierrc
└── package.json
```

---

### Per-Folder README Files

#### `app/README.md`

```markdown
# app/ — Expo Router Screens

File-based routing powered by Expo Router v4. Each file maps to a route.

## Route Groups

- `(auth)/` — Unauthenticated screens. Wrapped in a Stack navigator.
  User lands here if no session exists.
  - `login.tsx` → `/login`
  - `register.tsx` → `/register`
  - `forgot-password.tsx` → `/forgot-password`
  - `verify-email.tsx` → `/verify-email`

- `(tabs)/` — Authenticated tab navigator. 4 bottom tabs.
  - `home.tsx` → `/home` (Home dashboard)
  - `services.tsx` → `/services` (Department list → join queue)
  - `my-queue.tsx` → `/my-queue` (Active tickets)
  - `profile.tsx` → `/profile` (User profile + settings entry)

- `queue/` — Queue detail screens (Stack)
  - `[id].tsx` → `/queue/:id` (Ticket detail view)
  - `join.tsx` → `/queue/join?dept=ADM` (Join queue flow)

- `settings/` — Settings sub-screens (Stack)
  - `index.tsx`, `edit-profile.tsx`, `notification-settings.tsx`, `privacy.tsx`

- `admin/` — Staff-only screens (gated by role check)
  - `index.tsx` → Admin dashboard
  - `department/[id].tsx` → Manage specific department queue

## Key Conventions

- `_layout.tsx` at every level defines the navigator type
- Root `_layout.tsx` wraps everything in providers (Zustand is provider-free)
  and runs the auth gate: redirect to `(auth)` if no session
- Use `<Link>` and `router.push()` for navigation
- Deep link scheme: `queueless://` (configured in app.json)
```

#### `src/components/README.md`

```markdown
# src/components/ — UI Components

## Folder Structure

### ui/
Design system primitives. These are app-agnostic, reusable everywhere.
- `Button.tsx` — Primary, secondary, ghost, destructive variants
- `Card.tsx` — Surface card with shadow and optional left border accent
- `Badge.tsx` — Status pills (active, waiting, completed, cancelled)
- `Input.tsx` — Text input with label, error, and icon support
- `Avatar.tsx` — User avatar with fallback initials
- `Skeleton.tsx` — Loading placeholder shapes
- `Toast.tsx` — Top-sliding notification toast
- `BottomSheet.tsx` — Modal bottom sheet (uses @gorhom/bottom-sheet)
- `Divider.tsx`
- `EmptyState.tsx`

### queue/
Queue-domain components. Import `ui/` primitives.
- `QueueNumberDisplay.tsx` — Large ticket number with animated counter
- `QueueStatusBadge.tsx` — Status-specific badge with color
- `QueuePositionCard.tsx` — "People ahead of you: 12"
- `QueueProgressTracker.tsx` — Joined → In Line → Almost → At Counter
- `LiveBoardItem.tsx` — Single row in the live queue board
- `DepartmentCard.tsx` — Tappable department selector with icon
- `WaitTimeEstimate.tsx` — Estimated wait with clock icon
- `QueueTicketCard.tsx` — Card for "Recent Activity" list items

### auth/
- `LoginForm.tsx`
- `RegisterForm.tsx`
- `DomainEmailInput.tsx` — Input with @mcm.edu.ph suffix hint

### home/
- `GreetingHeader.tsx` — Gradient header with "Good Morning, Joshua"
- `StatsRow.tsx` — Active / Completed / Cancelled counters
- `QuickActions.tsx` — Icon grid (Join Queue, My Tickets, etc.)
- `RecentActivity.tsx` — List of recent queue entries

### layout/
- `SafeAreaWrapper.tsx`
- `ScreenHeader.tsx` — Back arrow + title + optional right action
- `TabBar.tsx` — Custom bottom tab bar (if needed beyond default)

## Conventions
- All components use TypeScript with explicit prop interfaces
- Animations use Reanimated 3 `useAnimatedStyle` and `withSpring`/`withTiming`
- Styling via Nativewind classNames, referencing theme tokens
- Every component exports a default export
```

#### `src/stores/README.md`

```markdown
# src/stores/ — Zustand State Management

## Architecture

Each store is a standalone Zustand slice. No providers needed.
Import and use directly: `const user = useAuthStore(s => s.user);`

## Stores

### useAuthStore.ts
- `session` — Supabase auth session
- `profile` — User profile from `profiles` table
- `isLoading` — Auth state loading
- `signIn(email, password)` → Supabase auth + fetch profile
- `signUp(data)` → Register + auto-create profile via trigger
- `signOut()` → Clear session + reset all stores
- `updateProfile(data)` → Patch profile + optimistic update
- `uploadAvatar(uri)` → Firebase Storage upload → update avatar_url

### useQueueStore.ts
- `activeTickets` — User's current waiting/serving tickets
- `liveBoard` — Live queue data keyed by department_id
- `joinQueue(departmentId)` → Call edge function → add to activeTickets
- `cancelTicket(ticketId)` → Update status → remove from activeTickets
- `subscribeToDepartment(deptId)` → Supabase Realtime channel
- `handleRealtimeUpdate(payload)` → Merge realtime changes into state

### useNotificationStore.ts
- `notifications` — Paginated notification list
- `unreadCount` — Badge number
- `fetchNotifications(page)` → Paginated query
- `markAsRead(id)` → Optimistic update
- `markAllAsRead()`

### useDepartmentStore.ts
- `departments` — List of all departments with schedules
- `counters` — Counters per department
- `fetchDepartments()` → Single query on app load, cached

### useSettingsStore.ts
- `notificationsEnabled` — Push toggle
- `theme` — 'light' | 'dark' | 'system' (future)
- Persisted to AsyncStorage via Zustand `persist` middleware

## Conventions
- Use selectors to prevent unnecessary re-renders:
  `const name = useAuthStore(s => s.profile?.full_name);`
- Reset stores on sign-out: each store exposes a `reset()` action
- Validate API responses with Zod before storing (in service layer)
```

#### `src/services/README.md`

```markdown
# src/services/ — Business Logic & API Layer

The service layer sits between stores and Supabase/Firebase.
All Supabase calls go through services. Stores call services, not the SDK directly.

## Services

### auth.service.ts
- `signInWithEmail(email, password)` → Supabase auth.signInWithPassword
- `signUpWithEmail(data)` → Validate with registerSchema → Supabase auth.signUp
- `signOut()` → Supabase auth.signOut
- `resetPassword(email)` → Supabase auth.resetPasswordForEmail
- `getSession()` → Supabase auth.getSession
- `onAuthStateChange(callback)` → Supabase auth.onAuthStateChange

### queue.service.ts
- `joinQueue(departmentId)` → Call `generate-ticket` edge function
- `cancelTicket(ticketId)` → Update queue_tickets status
- `getActiveTickets(userId)` → Query active tickets for user
- `getLiveBoard(departmentId)` → Query today's tickets ordered by position
- `getQueueHistory(userId, page)` → Paginated completed tickets
- `getQueueDetails(ticketId)` → Full ticket with department + counter info

### notification.service.ts
- `registerPushToken(token)` → Upsert into push_tokens
- `getNotifications(userId, page)` → Paginated query
- `markAsRead(notificationId)` → Update is_read
- `getUnreadCount(userId)` → Count query

### department.service.ts
- `getAllDepartments()` → Fetch departments + counters + today's schedule
- `getDepartmentStatus(deptId)` → Current serving, waiting count, estimated wait

### profile.service.ts
- `getProfile(userId)` → Fetch from profiles
- `updateProfile(userId, data)` → Validate with profileSchema → update
- `uploadAvatar(userId, imageUri)` → Firebase Storage upload → return URL

### waittime.service.ts
- `estimateWait(departmentId)` → Query current queue + stats → calculate

## Conventions
- Every service function validates inputs with Zod
- Every Supabase response is validated with Zod before returning
- Services throw typed errors (see src/types/errors.ts)
- No UI logic in services — they return data, stores update state
```

#### `src/schemas/README.md`

```markdown
# src/schemas/ — Zod Validation Schemas

Single source of truth for data shapes. Used in:
1. React Hook Form validation (via @hookform/resolvers/zod)
2. Service layer response validation
3. TypeScript type inference (`z.infer<typeof Schema>`)

## Files

### auth.schema.ts
- `loginSchema` — email + password
- `registerSchema` — fullName + email(@mcm.edu.ph) + password + confirmPassword + studentId
- `resetPasswordSchema` — email only
- `updatePasswordSchema` — newPassword + confirmPassword

### profile.schema.ts
- `updateProfileSchema` — fullName, displayName, phone, studentId
- `profileResponseSchema` — Full profile shape from Supabase

### queue.schema.ts
- `joinQueueSchema` — departmentId validation
- `queueTicketSchema` — Full ticket shape
- `liveQueueResponseSchema` — Array of tickets for board

### notification.schema.ts
- `notificationSchema` — Single notification shape
- `notificationListSchema` — Paginated response

### department.schema.ts
- `departmentSchema` — Department with schedule and counters
- `departmentListSchema` — Array response

## Convention
- File name matches domain: `queue.schema.ts` for queue-related schemas
- Export both the schema and the inferred type:
  ```typescript
  export const queueTicketSchema = z.object({ ... });
  export type QueueTicket = z.infer<typeof queueTicketSchema>;
  ```
```

#### `src/lib/README.md`

```markdown
# src/lib/ — SDK Client Initialization

Thin wrappers around third-party SDKs. Initialized once, imported everywhere.

## Files

### supabase.ts
Initialize Supabase client with AsyncStorage for session persistence:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // important for RN
    },
  }
);
```

### firebase.ts
Firebase app + storage initialization for profile images:

```typescript
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

### env.ts
Zod-validated environment variables:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```
```

#### `src/constants/README.md`

```markdown
# src/constants/ — Theme Tokens & Configuration

## Files

### theme.ts
All design tokens from the Design System section of the masterplan:

- Colors (primary, accent, backgrounds, semantic)
- Typography (font families, sizes, weights, line heights)
- Spacing scale (4-64px on 8px grid)
- Border radii
- Shadows (as React Native shadow objects)
- Animation durations and easing curves

### departments.ts
Static department metadata for fast lookups:

```typescript
export const DEPARTMENTS = {
  ADM: { prefix: 'A', name: 'Admissions', icon: 'graduation-cap', color: '#004E98' },
  REG: { prefix: 'R', name: 'Registrar', icon: 'file-text', color: '#3A6EA5' },
  TRS: { prefix: 'T', name: 'Treasury', icon: 'landmark', color: '#FF6700' },
  SCH: { prefix: 'S', name: 'Scholarships', icon: 'dollar-sign', color: '#22C55E' },
  HLP: { prefix: 'H', name: 'Help Desk', icon: 'help-circle', color: '#6B7280' },
} as const;
```

### config.ts
App-wide configuration:

- `GRACE_PERIOD_MINUTES = 5`
- `MAX_QUEUE_PER_USER = 1` (per department)
- `NOTIFICATION_THRESHOLD = 2` (notify when N people ahead)
- `QUEUE_RESET_HOUR = 6` (daily reset at 6 AM)
- `DEFAULT_PAGE_SIZE = 20`
```

#### `src/hooks/README.md`

```markdown
# src/hooks/ — Custom React Hooks

## Files

### useAuth.ts
Wraps `useAuthStore` + Supabase auth state listener. Used in root layout
for auth gate logic. Returns `{ session, profile, isLoading, isAuthenticated }`.

### useQueue.ts
Subscribes to Supabase Realtime for queue updates. Manages subscription
lifecycle (subscribe on mount, unsubscribe on unmount).
Returns `{ liveBoard, isConnected, subscribe, unsubscribe }`.

### useCountdown.ts
Animated countdown for estimated wait time. Takes target time,
returns `{ minutes, seconds, isExpired }`.

### usePushNotifications.ts
Handles push token registration, permission requests, and notification
received/response listeners. Registers token with Supabase on login.

### useRefreshOnFocus.ts
Re-fetches data when screen comes into focus (React Navigation focus event).
Prevents stale data on tab switch.

### useDebounce.ts
Standard debounce hook for search inputs.

### useNetworkStatus.ts
Monitors connectivity. Shows offline banner when disconnected.
Queues actions for retry when back online.
```

#### `supabase/README.md`

```markdown
# supabase/ — Backend Configuration

## Structure

### migrations/
SQL migration files applied via `supabase db push` or `supabase migration up`.
Files are timestamped: `20260603000001_initial_schema.sql`.

### functions/
Supabase Edge Functions (Deno runtime). Each folder = one function.

#### generate-ticket/
Called when user joins a queue. Atomically:
1. Gets/creates today's `daily_sequences` row for the department
2. Increments `last_number` (with row lock to prevent race conditions)
3. Constructs ticket_number as `prefix + padded_number` (e.g. "A023")
4. Inserts into `queue_tickets`
5. Returns the new ticket

#### advance-queue/
Called by staff to serve the next person:
1. Marks current serving ticket as `completed`
2. Logs duration in `ticket_logs`
3. Pulls next `waiting` ticket (ordered by position)
4. Marks it as `serving`, assigns counter
5. Triggers push notification to that user
6. Triggers "almost your turn" notification to user N+2

#### estimate-wait/
Calculates estimated wait time:
1. Counts people ahead in queue
2. Queries `wait_time_stats` for current hour + department
3. Multiplies avg_service_seconds × people_ahead
4. Applies buffer for uncertainty
5. Returns range (e.g. "15-20 mins")

#### send-notification/
Relay to Expo Push API:
1. Receives user_id + notification payload
2. Looks up active push tokens for user
3. Sends via Expo Push API
4. Inserts into `notifications` table for in-app history

### seed.sql
Departments, counters, and schedules. Run once on fresh database.
```

---

## 12. Screen Inventory

Based on the provided mockups, here is every screen in the app:

| # | Screen | Route | Description |
|---|--------|-------|-------------|
| 1 | Splash / Landing | `/` | Logo + "Skip the line, Save your time." + Join Queue / I have a booking |
| 2 | Login | `/login` | Email + password form |
| 3 | Register | `/register` | Full name, email, password, student ID |
| 4 | Forgot Password | `/forgot-password` | Email input → reset link |
| 5 | Verify Email | `/verify-email` | OTP or confirmation pending screen |
| 6 | **Home (Dashboard)** | `/home` | Greeting header, stats row, quick actions, recent activity |
| 7 | **Services (Departments)** | `/services` | Searchable department list → tap to join |
| 8 | Join Queue | `/queue/join?dept=X` | Confirm department + estimated wait → "Get in Queue" |
| 9 | **My Queue** | `/my-queue` | Active ticket: number, department, position, wait time, progress tracker |
| 10 | Queue Details | `/queue/:id` | Full ticket detail: number, status, currently serving, position, estimated wait, important reminder, Notify Me / Cancel buttons |
| 11 | **Profile** | `/profile` | Avatar, name, email, phone, menu list (My Bookings, Queue History, Favorite Branches, Notification Settings, Help & Support, About) |
| 12 | Settings | `/settings` | Edit Profile, Queue History, Notification Settings, Privacy & Security, Help & Support, Logout |
| 13 | Edit Profile | `/settings/edit-profile` | Editable fields + avatar upload |
| 14 | Queue History | `/settings/queue-history` | Paginated list of past tickets |
| 15 | Notification Settings | `/settings/notification-settings` | Toggles for each notification type |
| 16 | Notifications | `/notifications` | Chronological notification list with read/unread |
| 17 | Live Queue Board | `/live-queue` | Tabs per department. Shows NOW SERVING + upcoming list |
| 18 | **Admin: Dashboard** | `/admin` | Staff view: department selector, current serving, next button |
| 19 | **Admin: Department** | `/admin/department/:id` | Manage queue: serve next, skip, call specific number |

---

## 13. Development Phases

### Phase 1 — Foundation (Week 1-2)

- Expo project setup with TypeScript + Nativewind
- Supabase project + run migrations + seed data
- Firebase project setup for storage
- Auth flow: register, login, email verification, logout
- Profile CRUD + avatar upload
- Navigation structure (tabs, stacks)
- Design system components (ui/ folder)

### Phase 2 — Core Queue (Week 3-4)

- Department listing screen
- Join queue flow + edge function
- My Queue screen with live data
- Queue Details screen
- Supabase Realtime subscriptions
- Live Queue Board screen
- Queue cancellation

### Phase 3 — Notifications & Staff (Week 5-6)

- Push notification registration + handling
- Notification triggers on queue events
- In-app notification screen
- Staff admin panel (advance queue, skip, manage)
- Queue history

### Phase 4 — Polish & AI (Week 7-8)

- Wait time estimation (basic model)
- Data collection pipeline (ticket_logs → wait_time_stats)
- Animations and transitions (Reanimated 3)
- Offline handling and error states
- Settings and preferences
- Testing + bug fixes

### Phase 5 — Release Prep

- EAS Build configuration
- App icons and splash screen
- App store metadata
- Internal testing (TestFlight / Internal Track)
- Demo preparation

---

## 14. Environment Setup

### Prerequisites

```bash
node >= 18
bun (or pnpm/npm)
expo-cli (npx expo)
eas-cli (npm install -g eas-cli)
supabase-cli (brew install supabase/tap/supabase)
```

### Quick Start

```bash
# Clone and install
git clone <repo-url> queueless && cd queueless
bun install

# Environment
cp .env.example .env.local
# Fill in:
# EXPO_PUBLIC_SUPABASE_URL=
# EXPO_PUBLIC_SUPABASE_ANON_KEY=
# EXPO_PUBLIC_FIREBASE_API_KEY=
# EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=

# Start Supabase locally (optional for dev)
supabase start
supabase db push         # apply migrations
supabase functions serve  # run edge functions locally

# Start Expo
bun start                 # or: npx expo start
# Press 'a' for Android, 'i' for iOS simulator, scan QR for physical device
```

### EAS Build

```bash
eas build --profile development --platform all   # dev client
eas build --profile preview --platform all        # internal testing
eas build --profile production --platform all     # store release
```

---

## Appendix A: Key Dependencies

```json
{
  "dependencies": {
    "expo": "~52.x",
    "expo-router": "~4.x",
    "expo-notifications": "~0.x",
    "expo-font": "~13.x",
    "expo-image-picker": "~16.x",
    "expo-secure-store": "~14.x",
    "react-native-reanimated": "~3.x",
    "nativewind": "~4.x",
    "@supabase/supabase-js": "^2.x",
    "firebase": "^10.x",
    "zustand": "^4.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "@gorhom/bottom-sheet": "^4.x",
    "lucide-react-native": "^0.x",
    "react-native-svg": "^15.x",
    "date-fns": "^3.x"
  }
}
```

## Appendix B: Ticket Number Format

```
[PREFIX][ZERO-PADDED-NUMBER]

Prefix:  A | R | T | S | H
Number:  3-digit zero-padded, resets daily

Examples: A001, A002, ... A999
          R001, R002, ... R150
          T001, H001, S001

Display: Large, bold, Plus Jakarta Sans 800, 48px
         Color: --color-primary (#004E98)
```

## Appendix C: Queue Status State Machine

```
                  ┌──────────┐
        ┌────────►│ cancelled │
        │         └──────────┘
        │
┌───────┴──┐      ┌──────────┐      ┌───────────┐
│  waiting  ├─────►│ serving  ├─────►│ completed │
└───────┬──┘      └────┬─────┘      └───────────┘
        │              │
        │         ┌────▼─────┐
        │         │ skipped  │ ──► (can rejoin → new waiting ticket)
        │         └──────────┘
        │
        │         ┌──────────┐
        └────────►│ expired  │ (grace period exceeded)
                  └──────────┘

Valid transitions:
  waiting  → serving | cancelled | expired
  serving  → completed | skipped
  skipped  → (user creates new ticket if they want to rejoin)
```

---

*This masterplan is a living document. Update it as decisions change during development.*
