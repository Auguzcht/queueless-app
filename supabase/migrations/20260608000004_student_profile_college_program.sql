-- ============================================================
-- QueueLess — Student Profile College/Program FK (v6)
-- Created: 2026-06-08
--
-- Problem: fn_handle_new_user ignores college_id and program_id
-- from metadata. The trigger inserts student_profiles with
-- hardcoded 'college' / 'first_year' and NULL college_id/program_id.
--
-- Fix: Updated trigger reads college_id (UUID) and program_id
-- (code like 'BSCS') from metadata, resolves program code to
-- UUID, and stores both FKs.
--
-- Also backfills Alfred Nodado's existing entry (profile
-- 6ba9de06-2115-4900-8bba-7b1fe9eb49f6) by reading his
-- raw_user_meta_data from auth.users.
-- ============================================================

-- ============================================================
-- REPLACE: fn_handle_new_user — read college_id + program_id
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
  v_education_level education_level;
  v_year_level year_level;
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
      -- Education level (default 'college')
      BEGIN
        v_education_level := COALESCE(
          NULLIF(TRIM(NEW.raw_user_meta_data ->> 'education_level'), ''),
          'college'
        )::education_level;
      EXCEPTION WHEN OTHERS THEN
        v_education_level := 'college';
      END;

      -- Year level (default 'first_year')
      BEGIN
        v_year_level := COALESCE(
          NULLIF(TRIM(NEW.raw_user_meta_data ->> 'year_level'), ''),
          'first_year'
        )::year_level;
      EXCEPTION WHEN OTHERS THEN
        v_year_level := 'first_year';
      END;

      -- College UUID
      BEGIN
        v_college_id := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'college_id'), '')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_college_id := NULL;
      END;

      -- Program code → resolve to UUID
      v_program_code := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'program_id'), '');
      IF v_program_code IS NOT NULL THEN
        SELECT id INTO v_program_id FROM programs WHERE code = v_program_code LIMIT 1;
      ELSE
        v_program_id := NULL;
      END IF;

      INSERT INTO student_profiles (
        profile_id, student_id, education_level, year_level,
        college_id, program_id
      )
      VALUES (
        NEW.id, v_student_id,
        v_education_level,
        v_year_level,
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
-- BACKFILL: Update Alfred Nodado's existing student_profiles
-- with college + program from his auth.users metadata
-- ============================================================
UPDATE student_profiles sp
SET
  college_id = sub.college_id,
  program_id = sub.program_id,
  education_level = sub.education_level,
  year_level = sub.year_level
FROM (
  SELECT
    (au.raw_user_meta_data ->> 'college_id')::UUID AS college_id,
    p.id AS program_id,
    COALESCE(
      NULLIF(au.raw_user_meta_data ->> 'education_level', ''),
      'college'
    )::education_level AS education_level,
    COALESCE(
      NULLIF(au.raw_user_meta_data ->> 'year_level', ''),
      'first_year'
    )::year_level AS year_level,
    sp2.id AS student_profile_id
  FROM auth.users au
  JOIN student_profiles sp2 ON sp2.profile_id = au.id
  LEFT JOIN programs p ON p.code = au.raw_user_meta_data ->> 'program_id'
  WHERE au.id = '6ba9de06-2115-4900-8bba-7b1fe9eb49f6'
) sub
WHERE sp.id = sub.student_profile_id;
