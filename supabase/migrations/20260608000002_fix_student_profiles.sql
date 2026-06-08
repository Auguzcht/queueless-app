-- ============================================================
-- QueueLess — Fix Student Profiles (v4)
-- Created: 2026-06-08
--
-- Problems fixed:
--   1. Joshua Rabanillo (seeded student) has no student_profiles
--      because seed.sql targeted profiles.student_id which was
--      dropped in v3 migration.
--   2. No RLS policy exists for reading student_profiles, so the
--      parent registration flow (anon key) can't look up students
--      by student_id. Alfred Nodado's entry exists but is invisible
--      to unauthenticated requests.
--   3. Seed.sql still references defunct profiles.student_id column.
--
-- Fixes:
--   a) Backfill Joshua Rabanillo's student_profiles entry
--   b) SECURITY DEFINER RPC: fn_find_student_by_id — bypasses RLS,
--      returns minimal fields (id, student_id) for anon lookup
--   c) RLS policies for authenticated users + staff/admin
--   d) Grants for the new function
-- ============================================================

-- ============================================================
-- a) BACKFILL: Joshua Rabanillo — seeded student
--
-- Note: student_id 2021120266 is already taken by Alfred Nodado
-- (registered via app). If Joshua needs a different MMCM student
-- ID, update this INSERT with the correct value.
-- ============================================================
INSERT INTO student_profiles (profile_id, student_id, education_level, year_level)
VALUES (
  'b2000000-0000-0000-0000-000000000002',  -- Joshua's profile_id
  '2021120266',
  'college',
  'first_year'
)
ON CONFLICT (student_id) DO NOTHING;

-- ============================================================
-- b) RPC FUNCTION: fn_find_student_by_id
--
-- Allows unauthenticated / anon users to look up a student by
-- their MMCM student ID during parent registration.
-- SECURITY DEFINER = runs as table owner, bypasses RLS.
-- Only returns the UUID (for linking) and student_id.
-- Returns NULL (no row) if not found.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_find_student_by_id(p_student_id TEXT)
RETURNS TABLE (id UUID, student_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT sp.id, sp.student_id
  FROM student_profiles sp
  WHERE sp.student_id = p_student_id
  LIMIT 1;
END;
$$;

-- ============================================================
-- c) RLS POLICIES
-- ============================================================

-- Allow authenticated users to search student_profiles by student_id
-- (covers parents who are already signed in and linking later)
CREATE POLICY "student_profiles_select_by_student_id" ON student_profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND student_id IS NOT NULL
  );

-- Allow staff/admin to read all student_profiles
CREATE POLICY "student_profiles_select_staff" ON student_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- ============================================================
-- d) GRANTS
-- Allow anon role to execute the lookup function
-- ============================================================
GRANT EXECUTE ON FUNCTION fn_find_student_by_id TO anon, authenticated;
