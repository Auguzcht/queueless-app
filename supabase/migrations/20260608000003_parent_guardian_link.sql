-- ============================================================
-- QueueLess — Parent-Guardian Link on Signup (v5)
-- Created: 2026-06-08
--
-- Problem: Parent registration creates profile but doesn't
-- insert into student_guardians. The parent_student_id entered
-- during onboarding is ignored.
--
-- Fix: Update fn_handle_new_user to handle user_type = 'parent'
-- by creating a student_guardians link atomically.
-- ============================================================

-- ============================================================
-- REPLACE: fn_handle_new_user — add parent linking logic
-- ============================================================
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_first  TEXT;
  v_last   TEXT;
  v_role   user_role := 'student';
  v_student_id TEXT;
  v_parent_student_id TEXT;
  v_student_profile_id UUID;
  v_college_id UUID;
  v_program_code TEXT;
  v_program_id UUID;
BEGIN
  v_first  := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), split_part(NEW.email, '@', 1));
  v_last   := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'), ''), '—');
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student');
  EXCEPTION WHEN OTHERS THEN v_role := 'student'; END;

  INSERT INTO profiles (id, first_name, last_name, role)
  VALUES (NEW.id, v_first, v_last, v_role)
  ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name;

  -- ── Student: create student_profiles entry ─────────────────
  IF NEW.raw_user_meta_data ->> 'user_type' = 'student' THEN
    v_student_id := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'student_id'), '');
    IF v_student_id IS NOT NULL THEN
      -- Read education fields from metadata
      v_college_id := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'college_id'), '')::UUID;
      v_program_code := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'program_id'), '');

      -- Resolve program code (e.g. 'BSCS') to UUID
      IF v_program_code IS NOT NULL THEN
        SELECT id INTO v_program_id FROM programs WHERE code = v_program_code LIMIT 1;
      END IF;

      INSERT INTO student_profiles (
        profile_id, student_id, education_level, year_level,
        college_id, program_id
      )
      VALUES (
        NEW.id, v_student_id,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'education_level'), ''), 'college')::education_level,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'year_level'), ''), 'first_year')::year_level,
        v_college_id,
        v_program_id
      )
      ON CONFLICT (profile_id) DO UPDATE
        SET student_id       = EXCLUDED.student_id,
            education_level  = EXCLUDED.education_level,
            year_level       = EXCLUDED.year_level,
            college_id       = COALESCE(EXCLUDED.college_id, student_profiles.college_id),
            program_id       = COALESCE(EXCLUDED.program_id, student_profiles.program_id);
    END IF;
  END IF;

  -- ── Parent: create student_guardians link ──────────────────
  IF NEW.raw_user_meta_data ->> 'user_type' = 'parent' THEN
    v_parent_student_id := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'parent_student_id'), '');
    IF v_parent_student_id IS NOT NULL THEN
      -- Resolve the student_profiles.id from the student_id
      SELECT sp.id INTO v_student_profile_id
      FROM student_profiles sp
      WHERE sp.student_id = v_parent_student_id
      LIMIT 1;

      IF v_student_profile_id IS NOT NULL THEN
        INSERT INTO student_guardians (guardian_id, student_id, relationship, is_primary)
        VALUES (NEW.id, v_student_profile_id, 'guardian', TRUE)
        ON CONFLICT (guardian_id, student_id) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- RLS: Allow guardians to see linked student_profiles
-- (already exists from v3 migration — verifying here)
-- ============================================================
-- Already covered by:
--   student_profiles_select_guardian policy from v3 migration
--   guardians_select_own / guardians_insert_own from v3 migration

-- ============================================================
-- GRANTS
-- ============================================================
GRANT ALL ON student_guardians TO anon, authenticated;
