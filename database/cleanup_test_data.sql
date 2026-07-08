-- =============================================
-- Cleanup Test Data
-- Cantonment Public School and College, Rangpur
-- =============================================
-- Run this to remove all test data inserted by
-- test_data.sql while keeping the schema
-- (classes table, subjects table) intact.
-- =============================================
-- WARNING: This deletes ALL routines,
-- class teachers, teacher subjects, teachers
-- (with T-prefixed IDs), and ALL sections.
-- Comment out lines you want to preserve.
-- =============================================

-- 1. Delete all generated routines
DELETE FROM routines;

-- 2. Delete class teacher assignments
DELETE FROM class_teachers;

-- 3. Delete teacher-subject assignments (for test teachers)
DELETE FROM teacher_subjects
WHERE teacher_id IN (SELECT id FROM teachers WHERE teacher_id LIKE 'T%');

-- 4. Delete test teachers (teacher_id starting with 'T')
DELETE FROM teachers WHERE teacher_id LIKE 'T%';

-- 5. Delete ALL sections
--    Comment this out if you created sections outside of test_data.sql
DELETE FROM sections;
