-- ============================================================
-- QueueLess — Seed Data (v2 — matches normalized schema)
-- Run after initial migration: supabase db seed
--
-- Seeds:
--   1. Departments (5 MMCM offices)
--   2. Counters (2 per department, 10 total)
--   3. Department Schedules (Mon-Fri open, Sat-Sun closed)
--   4. Daily sequences for today
--   5. Demo users (admin, staff, student) — REMOVE IN PRODUCTION
--
-- Important: raw_user_meta_data now uses first_name, middle_name,
-- last_name instead of full_name. The fn_handle_new_user trigger
-- reads these fields to create the profile row automatically.
-- ============================================================

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, name, code, prefix, description, icon, color, display_order)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Admissions',
    'ADM',
    'A',
    'New student enrollment',
    'graduation-cap',
    '#004E98',
    1
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Registrar',
    'REG',
    'R',
    'Records and documents',
    'file-text',
    '#3A6EA5',
    2
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Treasury',
    'TRS',
    'T',
    'Payments and fees',
    'landmark',
    '#FF6700',
    3
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Scholarships',
    'SCH',
    'S',
    'Financial assistance',
    'dollar-sign',
    '#22C55E',
    4
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Help Desk',
    'HLP',
    'H',
    'General inquiries',
    'help-circle',
    '#6B7280',
    5
  )
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. COUNTERS — 2 per department
-- ============================================================
INSERT INTO counters (department_id, counter_number, label)
SELECT d.id, n, 'Counter ' || n
FROM departments d
CROSS JOIN generate_series(1, 2) AS n
ON CONFLICT (department_id, counter_number) DO NOTHING;

-- ============================================================
-- 3. DEPARTMENT SCHEDULES — Mon-Fri 8AM-5PM, Sat-Sun closed
-- ============================================================
INSERT INTO department_schedules (department_id, day_of_week, open_time, close_time, is_open)
SELECT
  d.id,
  dow,
  '08:00'::TIME,
  '17:00'::TIME,
  CASE WHEN dow BETWEEN 1 AND 5 THEN TRUE ELSE FALSE END
FROM departments d
CROSS JOIN generate_series(0, 6) AS dow
ON CONFLICT (department_id, day_of_week) DO NOTHING;

-- ============================================================
-- 4. DAILY SEQUENCES — initialize today for all departments
-- ============================================================
INSERT INTO daily_sequences (department_id, date, last_number)
SELECT d.id, CURRENT_DATE, 0
FROM departments d
ON CONFLICT (department_id, date) DO NOTHING;


-- ============================================================
-- 5. DEMO USERS
--
-- ⚠️  REMOVE THIS ENTIRE SECTION BEFORE PRODUCTION.
--
-- These inserts go directly into auth.users + auth.identities,
-- which fires the trg_on_auth_user_created trigger that auto-
-- creates the matching profiles row.
--
-- Credentials (change immediately if deploying):
--   admin@mcm.edu.ph   / ChangeMe123!
--   staff@mcm.edu.ph   / ChangeMe123!
--   student@mcm.edu.ph / ChangeMe123!
-- ============================================================

-- ── Admin ───────────────────────────────────────────────────
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  'b2000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@mcm.edu.ph',
  crypt('ChangeMe123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "first_name": "System",
    "middle_name": null,
    "last_name": "Admin",
    "role": "admin"
  }',
  FALSE,
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'b2000000-0000-0000-0000-000000000001',  -- use same UUID as user for simplicity
  'b2000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'sub', 'b2000000-0000-0000-0000-000000000001',
    'email', 'admin@mcm.edu.ph',
    'email_verified', true
  ),
  'email',
  'b2000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ── Staff ───────────────────────────────────────────────────
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  'b2000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff@mcm.edu.ph',
  crypt('ChangeMe123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "first_name": "Maria",
    "middle_name": "Santos",
    "last_name": "Dela Cruz",
    "role": "staff"
  }',
  FALSE,
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'b2000000-0000-0000-0000-000000000003',
  'b2000000-0000-0000-0000-000000000003',
  jsonb_build_object(
    'sub', 'b2000000-0000-0000-0000-000000000003',
    'email', 'staff@mcm.edu.ph',
    'email_verified', true
  ),
  'email',
  'b2000000-0000-0000-0000-000000000003',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ── Student ─────────────────────────────────────────────────
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  'b2000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'jRabanillo@mcm.edu.ph',
  crypt('ChangeMe123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "first_name": "Joshua",
    "middle_name": "Santos",
    "last_name": "Rabanillo",
    "role": "student"
  }',
  FALSE,
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'b2000000-0000-0000-0000-000000000002',
  'b2000000-0000-0000-0000-000000000002',
  jsonb_build_object(
    'sub', 'b2000000-0000-0000-0000-000000000002',
    'email', 'jRabanillo@mcm.edu.ph',
    'email_verified', true
  ),
  'email',
  'b2000000-0000-0000-0000-000000000002',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Set student-specific fields that the trigger doesn't handle
UPDATE profiles
SET student_id = '2021120266'
WHERE id = 'b2000000-0000-0000-0000-000000000002'
  AND student_id IS NULL;


-- ============================================================
-- VERIFICATION QUERIES
-- Uncomment and run to confirm seed worked correctly.
-- ============================================================

-- Departments
-- SELECT name, code, prefix, display_order FROM departments ORDER BY display_order;

-- Counters
-- SELECT d.name, c.counter_number, c.label
-- FROM counters c JOIN departments d ON d.id = c.department_id
-- ORDER BY d.display_order, c.counter_number;

-- Schedules (Admissions example)
-- SELECT d.name, ds.day_of_week, ds.is_open, ds.open_time, ds.close_time
-- FROM department_schedules ds JOIN departments d ON d.id = ds.department_id
-- WHERE d.code = 'ADM' ORDER BY ds.day_of_week;

-- Profiles (should be auto-created by trigger)
-- SELECT p.id, p.first_name, p.middle_name, p.last_name, p.role,
--        u.email, fn_get_full_name(p) AS full_name
-- FROM profiles p
-- JOIN auth.users u ON u.id = p.id
-- ORDER BY p.created_at;
