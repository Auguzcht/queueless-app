-- ============================================================
-- QueueLess — Initial Schema Migration (v2 — Normalized)
-- Created: 2026-06-03 | Revised: 2026-06-04
--
-- Changes from v1:
--   - 2NF: Removed email from profiles (lives in auth.users,
--          accessible via auth.email() or JOIN)
--   - 2NF: Removed display_name (computed from name parts)
--   - Split full_name → first_name, middle_name, last_name
--   - Added increment_daily_sequence RPC for atomic ticket issuance
--   - Fixed fn_handle_new_user to read split name fields
--   - Added fn_get_full_name helper for display convenience
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- crypt/gen_salt for seed users

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'parent', 'staff', 'admin');

CREATE TYPE ticket_status AS ENUM (
  'waiting',
  'serving',
  'completed',
  'skipped',
  'cancelled',
  'expired'
);

CREATE TYPE notification_type AS ENUM (
  'queue_joined',
  'almost_your_turn',
  'your_turn',
  'queue_completed',
  'queue_cancelled',
  'queue_skipped',
  'queue_expired',
  'system_announcement'
);

-- ============================================================
-- 1. PROFILES
--
-- Extends Supabase auth.users with app-specific fields.
-- Auto-created via trigger on auth.users INSERT.
--
-- 2NF notes:
--   • email is NOT stored here — it lives in auth.users.email.
--     Use auth.email() in RLS or JOIN auth.users when needed.
--   • Name is decomposed into atomic parts (1NF/2NF compliant).
--   • No derived/computed columns stored.
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  middle_name     TEXT,                  -- nullable (not everyone has one)
  last_name       TEXT NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,                  -- Firebase Storage download URL
  role            user_role NOT NULL DEFAULT 'student',
  student_id      TEXT,                  -- MMCM student ID (nullable for parents)
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_student_id ON profiles (student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_profiles_name ON profiles USING gin (
  (first_name || ' ' || COALESCE(middle_name, '') || ' ' || last_name) gin_trgm_ops
);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  code            TEXT NOT NULL UNIQUE,       -- 'ADM', 'REG', 'TRS', 'SCH', 'HLP'
  prefix          CHAR(1) NOT NULL UNIQUE,    -- 'A', 'R', 'T', 'S', 'H'
  description     TEXT,
  icon            TEXT,                        -- lucide icon name
  color           TEXT,                        -- hex brand color
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. COUNTERS
-- ============================================================
CREATE TABLE counters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  counter_number  INT NOT NULL,
  label           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (department_id, counter_number)
);

CREATE INDEX idx_counters_department ON counters (department_id);

-- ============================================================
-- 4. DEPARTMENT SCHEDULES
-- ============================================================
CREATE TABLE department_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time       TIME NOT NULL DEFAULT '08:00',
  close_time      TIME NOT NULL DEFAULT '17:00',
  is_open         BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE (department_id, day_of_week)
);

CREATE INDEX idx_dept_schedules_department ON department_schedules (department_id);

-- ============================================================
-- 5. DAILY SEQUENCES
-- ============================================================
CREATE TABLE daily_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  last_number     INT NOT NULL DEFAULT 0,

  UNIQUE (department_id, date)
);

CREATE INDEX idx_daily_seq_lookup ON daily_sequences (department_id, date);

-- ============================================================
-- 6. QUEUE TICKETS
-- ============================================================
CREATE TABLE queue_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   TEXT NOT NULL,
  department_id   UUID NOT NULL REFERENCES departments(id),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  counter_id      UUID REFERENCES counters(id),
  status          ticket_status NOT NULL DEFAULT 'waiting',
  position        INT NOT NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  skipped_at      TIMESTAMPTZ,
  expired_at      TIMESTAMPTZ,
  notes           TEXT,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_department_date ON queue_tickets (department_id, date);
CREATE INDEX idx_tickets_user ON queue_tickets (user_id);
CREATE INDEX idx_tickets_status ON queue_tickets (status);
CREATE INDEX idx_tickets_active_lookup ON queue_tickets (department_id, date, status, position);
CREATE INDEX idx_tickets_user_active ON queue_tickets (user_id, department_id, date)
  WHERE status IN ('waiting', 'serving');

-- ============================================================
-- 7. TICKET LOGS
-- ============================================================
CREATE TABLE ticket_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        UUID NOT NULL REFERENCES queue_tickets(id) ON DELETE CASCADE,
  previous_status  ticket_status,
  new_status       ticket_status NOT NULL,
  changed_by       UUID REFERENCES profiles(id),
  counter_id       UUID REFERENCES counters(id),
  duration_seconds INT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_logs_ticket ON ticket_logs (ticket_id);
CREATE INDEX idx_ticket_logs_created ON ticket_logs (created_at);
CREATE INDEX idx_ticket_logs_analytics ON ticket_logs (new_status, created_at);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_feed ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE is_read = FALSE;

-- ============================================================
-- 9. PUSH TOKENS
-- ============================================================
CREATE TABLE push_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user ON push_tokens (user_id);

-- ============================================================
-- 10. WAIT TIME STATS
-- ============================================================
CREATE TABLE wait_time_stats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id        UUID NOT NULL REFERENCES departments(id),
  date                 DATE NOT NULL,
  hour                 INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  day_of_week          INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  avg_wait_seconds     NUMERIC NOT NULL DEFAULT 0,
  avg_service_seconds  NUMERIC NOT NULL DEFAULT 0,
  total_served         INT NOT NULL DEFAULT 0,
  total_cancelled      INT NOT NULL DEFAULT 0,
  total_skipped        INT NOT NULL DEFAULT 0,
  peak_queue_length    INT NOT NULL DEFAULT 0,

  UNIQUE (department_id, date, hour)
);

CREATE INDEX idx_wait_stats_lookup ON wait_time_stats (department_id, day_of_week, hour);

-- ============================================================
-- 11. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  department_id   UUID REFERENCES departments(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_active ON announcements (is_active, starts_at, ends_at);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sequences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wait_time_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;

-- ── Profiles ────────────────────────────────────────────────
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin can update any profile (e.g. verify, change role)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── Departments (public read) ───────────────────────────────
CREATE POLICY "departments_select_all"
  ON departments FOR SELECT
  USING (true);

CREATE POLICY "departments_manage_admin"
  ON departments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Counters (public read) ──────────────────────────────────
CREATE POLICY "counters_select_all"
  ON counters FOR SELECT
  USING (true);

CREATE POLICY "counters_manage_admin"
  ON counters FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Department Schedules (public read) ──────────────────────
CREATE POLICY "schedules_select_all"
  ON department_schedules FOR SELECT
  USING (true);

-- ── Daily Sequences — no RLS policies.
-- Only accessed by edge functions using the service_role key.

-- ── Queue Tickets ───────────────────────────────────────────
CREATE POLICY "tickets_select_own"
  ON queue_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "tickets_select_live_board"
  ON queue_tickets FOR SELECT
  USING (date = CURRENT_DATE AND status IN ('waiting', 'serving'));

CREATE POLICY "tickets_insert_self"
  ON queue_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_cancel_self"
  ON queue_tickets FOR UPDATE
  USING (user_id = auth.uid() AND status = 'waiting')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "tickets_update_staff"
  ON queue_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- ── Ticket Logs ─────────────────────────────────────────────
CREATE POLICY "ticket_logs_select_own"
  ON ticket_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM queue_tickets
      WHERE queue_tickets.id = ticket_logs.ticket_id
        AND queue_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "ticket_logs_select_staff"
  ON ticket_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "ticket_logs_insert_staff"
  ON ticket_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- ── Notifications ───────────────────────────────────────────
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── Push Tokens ─────────────────────────────────────────────
CREATE POLICY "push_tokens_manage_own"
  ON push_tokens FOR ALL
  USING (user_id = auth.uid());

-- ── Wait Time Stats (public read) ──────────────────────────
CREATE POLICY "wait_stats_select_all"
  ON wait_time_stats FOR SELECT
  USING (true);

-- ── Announcements ───────────────────────────────────────────
CREATE POLICY "announcements_select_active"
  ON announcements FOR SELECT
  USING (
    is_active = TRUE
    AND starts_at <= NOW()
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

CREATE POLICY "announcements_manage_admin"
  ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- ── Auto-update updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================================
-- Auto-create profile when a new user signs up via Supabase Auth
--
-- Reads from raw_user_meta_data passed during signUp():
--   {
--     "first_name": "Joshua",
--     "middle_name": "Santos",      ← optional
--     "last_name": "Rabanillo",
--     "role": "student"             ← optional, defaults to 'student'
--   }
--
-- If first_name/last_name aren't provided (e.g. someone signs up
-- with just email+password and no metadata), we fall back to
-- parsing the email local part as first_name and '—' as last_name
-- so the INSERT never fails on NOT NULL. The user can fix their
-- name later in Edit Profile.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as table owner, bypasses RLS
SET search_path = 'public'
AS $$
DECLARE
  v_first  TEXT;
  v_middle TEXT;
  v_last   TEXT;
  v_role   user_role;
BEGIN
  -- Extract name parts from user_meta_data
  v_first  := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), '');
  v_middle := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'middle_name'), '');
  v_last   := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'), '');

  -- Fallback: if no name provided, derive from email
  IF v_first IS NULL THEN
    v_first := INITCAP(split_part(split_part(NEW.email, '@', 1), '.', 1));
  END IF;
  IF v_last IS NULL THEN
    -- Try second part of email local (e.g. joshua.rabanillo@mcm.edu.ph)
    v_last := NULLIF(INITCAP(split_part(split_part(NEW.email, '@', 1), '.', 2)), '');
    IF v_last IS NULL THEN
      v_last := '—';  -- placeholder, user updates later
    END IF;
  END IF;

  -- Role: read from metadata or default to 'student'
  BEGIN
    v_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'student';
  END;

  INSERT INTO public.profiles (
    id,
    first_name,
    middle_name,
    last_name,
    role
  ) VALUES (
    NEW.id,
    v_first,
    v_middle,
    v_last,
    v_role
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ── Enforce one active ticket per user per department per day ─
CREATE OR REPLACE FUNCTION fn_enforce_single_active_ticket()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('waiting', 'serving') THEN
    IF EXISTS (
      SELECT 1 FROM queue_tickets
      WHERE user_id = NEW.user_id
        AND department_id = NEW.department_id
        AND date = CURRENT_DATE
        AND status IN ('waiting', 'serving')
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'User already has an active ticket for this department today'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_single_active_ticket
  BEFORE INSERT OR UPDATE ON queue_tickets
  FOR EACH ROW EXECUTE FUNCTION fn_enforce_single_active_ticket();

-- ── Log ticket status changes + auto-set timestamps ─────────
CREATE OR REPLACE FUNCTION fn_log_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
  prev_status ticket_status;
  duration INT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    prev_status := OLD.status;

    duration := EXTRACT(EPOCH FROM (NOW() - COALESCE(
      CASE OLD.status
        WHEN 'waiting' THEN OLD.joined_at
        WHEN 'serving' THEN OLD.called_at
        ELSE OLD.created_at
      END,
      OLD.created_at
    )))::INT;

    INSERT INTO ticket_logs (ticket_id, previous_status, new_status, counter_id, duration_seconds)
    VALUES (NEW.id, prev_status, NEW.status, NEW.counter_id, duration);

    -- Auto-set the appropriate timestamp column
    CASE NEW.status
      WHEN 'serving'   THEN IF NEW.called_at    IS NULL THEN NEW.called_at    := NOW(); END IF;
      WHEN 'completed' THEN IF NEW.completed_at  IS NULL THEN NEW.completed_at  := NOW(); END IF;
      WHEN 'cancelled' THEN IF NEW.cancelled_at  IS NULL THEN NEW.cancelled_at  := NOW(); END IF;
      WHEN 'skipped'   THEN IF NEW.skipped_at    IS NULL THEN NEW.skipped_at    := NOW(); END IF;
      WHEN 'expired'   THEN IF NEW.expired_at    IS NULL THEN NEW.expired_at    := NOW(); END IF;
      ELSE NULL; -- 'waiting' has joined_at already set on INSERT
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_ticket_status_change
  BEFORE UPDATE ON queue_tickets
  FOR EACH ROW EXECUTE FUNCTION fn_log_ticket_status_change();


-- ============================================================
-- RPC FUNCTIONS (called via supabase.rpc() or edge functions)
-- ============================================================

-- ── Atomic ticket number generation ─────────────────────────
-- Uses FOR UPDATE row lock to prevent race conditions when
-- multiple users join the same department simultaneously.
CREATE OR REPLACE FUNCTION increment_daily_sequence(
  p_department_id UUID,
  p_date          DATE DEFAULT CURRENT_DATE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INT;
BEGIN
  -- Upsert: create today's row if it doesn't exist, then lock and increment
  INSERT INTO daily_sequences (department_id, date, last_number)
  VALUES (p_department_id, p_date, 1)
  ON CONFLICT (department_id, date)
  DO UPDATE SET last_number = daily_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- ── Get people ahead in queue ───────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_position_ahead(p_ticket_id UUID)
RETURNS INT AS $$
DECLARE
  result INT;
  v_dept UUID;
  v_date DATE;
  v_pos  INT;
BEGIN
  SELECT department_id, date, position
    INTO v_dept, v_date, v_pos
    FROM queue_tickets WHERE id = p_ticket_id;

  SELECT COUNT(*) INTO result
    FROM queue_tickets
    WHERE department_id = v_dept
      AND date = v_date
      AND status = 'waiting'
      AND position < v_pos;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ── Get current serving number for a department ─────────────
CREATE OR REPLACE FUNCTION fn_get_now_serving(p_department_id UUID)
RETURNS TABLE(ticket_number TEXT, counter_label TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT qt.ticket_number, c.label
    FROM queue_tickets qt
    LEFT JOIN counters c ON c.id = qt.counter_id
    WHERE qt.department_id = p_department_id
      AND qt.date = CURRENT_DATE
      AND qt.status = 'serving'
    ORDER BY qt.called_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ── Estimate wait time ──────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_estimate_wait_minutes(
  p_department_id UUID,
  p_position_ahead INT
)
RETURNS INT AS $$
DECLARE
  avg_svc NUMERIC;
  active_counters INT;
BEGIN
  SELECT COALESCE(AVG(avg_service_seconds), 300)
    INTO avg_svc
    FROM wait_time_stats
    WHERE department_id = p_department_id
      AND hour = EXTRACT(HOUR FROM NOW())::INT
      AND date >= CURRENT_DATE - INTERVAL '7 days';

  SELECT COUNT(*) INTO active_counters
    FROM counters
    WHERE department_id = p_department_id AND is_active = TRUE;

  IF active_counters = 0 THEN active_counters := 1; END IF;

  RETURN CEIL((avg_svc * p_position_ahead) / active_counters / 60.0);
END;
$$ LANGUAGE plpgsql;

-- ── Convenience: full name for display ──────────────────────
-- Call via: SELECT fn_get_full_name(profile_row)
-- Or in queries: SELECT fn_get_full_name(p.*) FROM profiles p
CREATE OR REPLACE FUNCTION fn_get_full_name(p profiles)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(
    p.first_name
    || COALESCE(' ' || p.middle_name, '')
    || ' ' || p.last_name
  );
$$;


-- ============================================================
-- VIEW: profile_with_email
-- Joins profiles with auth.users to get email when needed.
-- Use this in admin dashboards or anywhere you need the email.
-- In the mobile app, the client already knows auth.user.email
-- from the session, so you rarely need this view.
-- ============================================================
CREATE OR REPLACE VIEW profile_with_email AS
SELECT
  p.*,
  u.email,
  fn_get_full_name(p) AS full_name
FROM profiles p
JOIN auth.users u ON u.id = p.id;

-- Note: This view cannot have RLS directly. Access is controlled
-- by the RLS on the underlying profiles table + auth.users access.
-- Only use in server-side/edge function contexts with service_role.


-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- ============================================================
-- POSTGREST / API PERMISSIONS
-- Essential: without these, anon/authenticated roles get
-- "permission denied for table" errors from PostgREST.
-- RLS still controls row-level access on top of this.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
