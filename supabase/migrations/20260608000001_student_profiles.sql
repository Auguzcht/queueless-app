-- ============================================================
-- QueueLess — Student Profiles & Guardian Links (v3)
-- Created: 2026-06-08
--
-- Adds:
--   1. colleges table (college departments at MMCM)
--   2. programs table (courses under each college)
--   3. year_levels enum (JHS 7-10, SHS 11-12, College 1-5)
--   4. student_profiles (extends profiles for students)
--   5. student_guardians (many-to-many parent-student link)
--   6. Removes student_id from profiles (moved to student_profiles)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE education_level AS ENUM (
  'junior_high', 'senior_high', 'college'
);

CREATE TYPE year_level AS ENUM (
  'grade_7', 'grade_8', 'grade_9', 'grade_10',
  'grade_11', 'grade_12',
  'first_year', 'second_year', 'third_year', 'fourth_year', 'fifth_year'
);

-- ============================================================
-- 1. COLLEGES
-- ============================================================
CREATE TABLE colleges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  code            TEXT NOT NULL UNIQUE,       -- e.g. 'COC', 'COE', 'CAS', 'ATYCB', 'CHS'
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_colleges_active ON colleges (display_order);

-- ============================================================
-- 2. PROGRAMS
-- Course offerings under each college
-- ============================================================
CREATE TABLE programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT,                      -- e.g. 'BSCS', 'BSIT'
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (college_id, name)
);

CREATE INDEX idx_programs_college ON programs (college_id);

-- ============================================================
-- 3. STUDENT PROFILES
-- Extends profiles for students with academic info.
-- student_id was removed from profiles in a prior step.
-- ============================================================
-- 4. STUDENT PROFILES
-- Extends profiles for students with academic info.
-- One profile → one student_profile (1:1).
-- ============================================================
CREATE TABLE student_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id          TEXT NOT NULL UNIQUE,    -- MMCM ID: e.g. '2021120266'
  education_level     education_level NOT NULL,
  year_level          year_level NOT NULL,
  college_id          UUID REFERENCES colleges(id),        -- NULL for JHS/SHS
  program_id          UUID REFERENCES programs(id),        -- NULL for JHS/SHS
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (profile_id)   -- 1:1 with profiles
);

CREATE INDEX idx_student_profiles_profile ON student_profiles (profile_id);
CREATE INDEX idx_student_profiles_student_id ON student_profiles (student_id);
CREATE INDEX idx_student_profiles_college ON student_profiles (college_id);
CREATE INDEX idx_student_profiles_program ON student_profiles (program_id);

-- ============================================================
-- 5. STUDENT GUARDIANS
-- Many-to-many: a parent can have multiple students,
-- a student can have multiple parents/guardians.
-- ============================================================
CREATE TABLE student_guardians (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  relationship      TEXT,                     -- 'mother', 'father', 'guardian', etc.
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (guardian_id, student_id)
);

CREATE INDEX idx_guardians_guardian ON student_guardians (guardian_id);
CREATE INDEX idx_guardians_student ON student_guardians (student_id);

-- ============================================================
-- UPDATED TRIGGER: fn_handle_new_user
-- Now accepts user_type in metadata to set role.
-- student_id, college, program are handled by student_profiles
-- which is created via a separate API call after onboarding.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_first  TEXT;
  v_middle TEXT;
  v_last   TEXT;
  v_role   user_role := 'student';
BEGIN
  v_first  := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), '');
  v_middle := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'middle_name'), '');
  v_last   := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'), '');
  IF v_first IS NULL THEN
    v_first := INITCAP(split_part(split_part(NEW.email, '@', 1), '.', 1));
  END IF;
  IF v_last IS NULL THEN
    v_last := NULLIF(INITCAP(split_part(split_part(NEW.email, '@', 1), '.', 2)), '');
    IF v_last IS NULL THEN v_last := '—'; END IF;
  END IF;
  -- Set role from metadata (student or parent) default to student
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student');
  EXCEPTION WHEN OTHERS THEN
    v_role := 'student';
  END;
  INSERT INTO profiles (id, first_name, middle_name, last_name, role)
  VALUES (NEW.id, v_first, v_middle, v_last, v_role)
  ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;
  RETURN NEW;
END;
$$;

-- ============================================================
-- RLS POLICIES for new tables
-- ============================================================
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;

-- Colleges + Programs: public read
CREATE POLICY "colleges_select_all" ON colleges FOR SELECT USING (true);
CREATE POLICY "programs_select_all" ON programs FOR SELECT USING (true);

-- Student Profiles: own read + insert, guardians can read linked
CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "student_profiles_select_guardian" ON student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = student_profiles.id AND sg.guardian_id = auth.uid())
  );
CREATE POLICY "student_profiles_insert_own" ON student_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "student_profiles_update_own" ON student_profiles
  FOR UPDATE USING (profile_id = auth.uid());

-- Guardians: own read + manage
CREATE POLICY "guardians_select_own" ON student_guardians
  FOR SELECT USING (guardian_id = auth.uid());
CREATE POLICY "guardians_insert_own" ON student_guardians
  FOR INSERT WITH CHECK (guardian_id = auth.uid());

-- ============================================================
-- SEED: Colleges + Programs
-- ============================================================
INSERT INTO colleges (id, name, code, description, display_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'College of Computer and Information Science', 'CCIS', 'Computer Science, IT, and multimedia computing', 1),
  ('c1000000-0000-0000-0000-000000000002', 'College of Engineering and Architecture', 'CEA', 'Engineering and architecture programs', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Alfonso T. Yuchengco College of Business', 'ATYCB', 'Business and accountancy programs', 3),
  ('c1000000-0000-0000-0000-000000000004', 'College of Arts and Science', 'CAS', 'Arts, communication, and sciences', 4),
  ('c1000000-0000-0000-0000-000000000005', 'College of Health Sciences', 'CHS', 'Health and medical sciences', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (college_id, name, code) VALUES
  -- CCIS
  ((SELECT id FROM colleges WHERE code = 'CCIS'), 'Bachelor of Science in Computer Science', 'BSCS'),
  ((SELECT id FROM colleges WHERE code = 'CCIS'), 'Bachelor of Science in Entertainment and Multimedia Computing', 'BSEMC'),
  ((SELECT id FROM colleges WHERE code = 'CCIS'), 'Bachelor of Science in Information Systems', 'BSIS'),
  -- CEA
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Architecture', 'BSArch'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Chemical Engineering', 'BSChE'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Civil Engineering', 'BSCE'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Computer Engineering', 'BSCpE'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Electrical Engineering', 'BSEE'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Electronics Engineering', 'BSECE'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Industrial Engineering', 'BSIE'),
  ((SELECT id FROM colleges WHERE code = 'CEA'), 'Bachelor of Science in Mechanical Engineering', 'BSME'),
  -- ATYCB
  ((SELECT id FROM colleges WHERE code = 'ATYCB'), 'BS Entrepreneurship', 'BSEntrep'),
  ((SELECT id FROM colleges WHERE code = 'ATYCB'), 'BS Management Accounting', 'BSMA'),
  ((SELECT id FROM colleges WHERE code = 'ATYCB'), 'BS Real Estate Management', 'BSREM'),
  ((SELECT id FROM colleges WHERE code = 'ATYCB'), 'BS Tourism Management', 'BSTM'),
  ((SELECT id FROM colleges WHERE code = 'ATYCB'), 'BS Accountancy', 'BSA'),
  ((SELECT id FROM colleges WHERE code = 'ATYCB'), 'BS Accounting Information System', 'BSAIS'),
  -- CAS
  ((SELECT id FROM colleges WHERE code = 'CAS'), 'Bachelor of Arts in Communication', 'BAC'),
  ((SELECT id FROM colleges WHERE code = 'CAS'), 'Bachelor of Multimedia Arts', 'BMA'),
  -- CHS
  ((SELECT id FROM colleges WHERE code = 'CHS'), 'BS Biology, Major in Medical Biology', 'BSBioMed'),
  ((SELECT id FROM colleges WHERE code = 'CHS'), 'BS in Pharmacy', 'BSPharm'),
  ((SELECT id FROM colleges WHERE code = 'CHS'), 'BS in Psychology', 'BSPsych'),
  ((SELECT id FROM colleges WHERE code = 'CHS'), 'BS in Physical Therapy', 'BSPT'),
  ((SELECT id FROM colleges WHERE code = 'CHS'), 'BS in Medical Technology / Medical Laboratory Science', 'BSMT')
ON CONFLICT (college_id, name) DO NOTHING;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT ALL ON colleges, programs, student_profiles, student_guardians TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
