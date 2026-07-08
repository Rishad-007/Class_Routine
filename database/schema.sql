-- =============================================
-- Routine Generation System - Database Schema
-- Cantonment Public School and College, Rangpur
-- =============================================
-- Run this entire file in the Supabase SQL Editor
-- =============================================

-- 1. CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  periods_count INTEGER NOT NULL DEFAULT 6,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 2. SECTIONS
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(10) NOT NULL,
  UNIQUE(class_id, name)
);

-- 3. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  applicable_classes INTEGER[]
);

-- 4. TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  teacher_id VARCHAR(50) UNIQUE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEACHER-SUBJECT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  class_load INTEGER NOT NULL DEFAULT 0,
  UNIQUE(teacher_id, subject_id, class_id)
);

-- 6. CLASS TEACHERS
CREATE TABLE IF NOT EXISTS class_teachers (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(section_id),
  UNIQUE(teacher_id)
);

-- 7. ROUTINES
CREATE TABLE IF NOT EXISTS routines (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 4),
  period_number SMALLINT NOT NULL CHECK (period_number BETWEEN 1 AND 8),
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_class_teacher_period BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, day_of_week, period_number)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_routines_section ON routines(section_id);
CREATE INDEX IF NOT EXISTS idx_routines_teacher ON routines(teacher_id);
CREATE INDEX IF NOT EXISTS idx_routines_day_period ON routines(day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_class ON teacher_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON sections(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_section ON class_teachers(section_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON class_teachers(teacher_id);

-- ROW LEVEL SECURITY POLICIES
-- Allow all operations for all users (internal school tool)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON classes;
CREATE POLICY "Allow all" ON classes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON sections;
CREATE POLICY "Allow all" ON sections FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON subjects;
CREATE POLICY "Allow all" ON subjects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON teachers;
CREATE POLICY "Allow all" ON teachers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON teacher_subjects;
CREATE POLICY "Allow all" ON teacher_subjects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON class_teachers;
CREATE POLICY "Allow all" ON class_teachers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON routines;
CREATE POLICY "Allow all" ON routines FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- SEED DATA
-- =============================================

-- Classes
INSERT INTO classes (name, display_name, periods_count, sort_order) VALUES
  ('Six', 'Class 6', 7, 1),
  ('Seven', 'Class 7', 7, 2),
  ('Eight', 'Class 8', 7, 3),
  ('Nine', 'Class 9', 8, 4),
  ('Ten', 'Class 10', 8, 5)
ON CONFLICT (name) DO NOTHING;

-- Core Subjects (6-10)
INSERT INTO subjects (name, category, applicable_classes) VALUES
  ('Bangla 1st Paper', 'core', NULL),
  ('Bangla 2nd Paper (Grammar/Composition)', 'core', NULL),
  ('English for Today', 'core', NULL),
  ('English Grammar', 'core', NULL),
  ('Mathematics', 'core', NULL),
  ('Science', 'core', NULL),
  ('Bangladesh and Global Studies (BGS)', 'core', NULL),
  ('Information and Communication Technology (ICT)', 'core', NULL),
  ('Physical Education and Health', 'core', NULL),
  ('Arts and Crafts / Fine Arts', 'core', NULL),
  ('Moral and Religious Education (Islam)', 'core', NULL),
  ('Moral and Religious Education (Hinduism)', 'core', NULL),
  ('Moral and Religious Education (Christianity)', 'core', NULL),
  ('Moral and Religious Education (Buddhism)', 'core', NULL),
  ('Work and Life-Oriented Education', 'core', NULL)
ON CONFLICT (name) DO NOTHING;

-- Science Group (9-10)
INSERT INTO subjects (name, category, applicable_classes) VALUES
  ('Physics', 'science', ARRAY[9, 10]),
  ('Chemistry', 'science', ARRAY[9, 10]),
  ('Biology', 'science', ARRAY[9, 10]),
  ('Higher Mathematics', 'science', ARRAY[9, 10])
ON CONFLICT (name) DO NOTHING;

-- Business Studies Group (9-10)
INSERT INTO subjects (name, category, applicable_classes) VALUES
  ('Accounting', 'commerce', ARRAY[9, 10]),
  ('Finance and Banking', 'commerce', ARRAY[9, 10]),
  ('Business Entrepreneurship', 'commerce', ARRAY[9, 10])
ON CONFLICT (name) DO NOTHING;

-- Humanities Group (9-10)
INSERT INTO subjects (name, category, applicable_classes) VALUES
  ('Geography and Environment', 'humanities', ARRAY[9, 10]),
  ('History of Bangladesh and World Civilization', 'humanities', ARRAY[9, 10]),
  ('Civics and Citizenship', 'humanities', ARRAY[9, 10]),
  ('Economics', 'humanities', ARRAY[9, 10])
ON CONFLICT (name) DO NOTHING;

-- Additional Electives
INSERT INTO subjects (name, category, applicable_classes) VALUES
  ('Agriculture Studies', 'additional', ARRAY[9, 10]),
  ('Home Science', 'additional', ARRAY[9, 10]),
  ('Arabic', 'additional', ARRAY[9, 10]),
  ('Sanskrit', 'additional', ARRAY[9, 10]),
  ('Pali', 'additional', ARRAY[9, 10])
ON CONFLICT (name) DO NOTHING;
