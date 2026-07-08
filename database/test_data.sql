-- =============================================
-- Test Data for Routine Generation System
-- Cantonment Public School and College, Rangpur
-- =============================================
-- Prerequisites: schema.sql has been executed
-- (classes and subjects must already exist)
-- =============================================
-- How to use:
--   1. Run this file in Supabase SQL Editor
--   2. Generate routines via the web app
--   3. Run cleanup_test_data.sql to remove
-- =============================================

-- =============================================
-- 1. SECTIONS (3 per class: A, B, C × 5 classes)
-- =============================================
INSERT INTO sections (class_id, name)
SELECT c.id, s.name
FROM classes c
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS s(name)
ON CONFLICT (class_id, name) DO NOTHING;

-- =============================================
-- 2. TEACHERS (25 teachers: T001-T025)
-- =============================================
INSERT INTO teachers (name, teacher_id) VALUES
  ('Md. Abdur Rahman', 'T001'),
  ('Mrs. Fatima Begum', 'T002'),
  ('Md. Shahidul Islam', 'T003'),
  ('Mrs. Nasrin Akhter', 'T004'),
  ('Md. Rafiqul Hasan', 'T005'),
  ('Mrs. Selina Parvin', 'T006'),
  ('Md. Kamrul Hasan', 'T007'),
  ('Mrs. Rebeka Sultana', 'T008'),
  ('Md. Mozammel Haque', 'T009'),
  ('Mrs. Shirin Akhter', 'T010'),
  ('Md. Abdul Karim', 'T011'),
  ('Mrs. Anwara Begum', 'T012'),
  ('Md. Nurul Islam', 'T013'),
  ('Md. Sirajul Islam', 'T014'),
  ('Mrs. Mahmuda Khatun', 'T015'),
  -- Additional teachers for capacity
  ('Md. Abdul Gafur', 'T016'),
  ('Mrs. Shahida Parvin', 'T017'),
  ('Md. Shamsul Alam', 'T018'),
  ('Mrs. Tahmina Akhter', 'T019'),
  ('Md. Abul Kalam Azad', 'T020'),
  ('Mrs. Rowshan Ara', 'T021'),
  ('Md. Harun Or Rashid', 'T022'),
  ('Mrs. Nasima Begum', 'T023'),
  ('Md. Ziaur Rahman', 'T024'),
  ('Mrs. Khurshida Begum', 'T025')
ON CONFLICT (teacher_id) DO NOTHING;

-- =============================================
-- 3. TEACHER-SUBJECT ASSIGNMENTS
-- =============================================
DO $$
DECLARE
  -- Subject IDs
  bangla1_id INT; bangla2_id INT;
  eng1_id INT; eng_gram_id INT;
  math_id INT; science_id INT;
  bgs_id INT; ict_id INT;
  pe_id INT; arts_id INT;
  islam_id INT; work_id INT;
  physics_id INT; chemistry_id INT; biology_id INT;
  higher_math_id INT;
  accounting_id INT; finance_id INT; business_id INT;
  civics_id INT;
  -- Class IDs
  six_id INT; seven_id INT; eight_id INT; nine_id INT; ten_id INT;
  -- Teacher IDs
  t001 INT; t002 INT; t003 INT; t004 INT; t005 INT;
  t006 INT; t007 INT; t008 INT; t009 INT; t010 INT;
  t011 INT; t012 INT; t013 INT; t014 INT; t015 INT;
BEGIN
  -- Get subject IDs
  SELECT id INTO bangla1_id FROM subjects WHERE name = 'Bangla 1st Paper';
  SELECT id INTO bangla2_id FROM subjects WHERE name = 'Bangla 2nd Paper (Grammar/Composition)';
  SELECT id INTO eng1_id FROM subjects WHERE name = 'English for Today';
  SELECT id INTO eng_gram_id FROM subjects WHERE name = 'English Grammar';
  SELECT id INTO math_id FROM subjects WHERE name = 'Mathematics';
  SELECT id INTO science_id FROM subjects WHERE name = 'Science';
  SELECT id INTO bgs_id FROM subjects WHERE name = 'Bangladesh and Global Studies (BGS)';
  SELECT id INTO ict_id FROM subjects WHERE name = 'Information and Communication Technology (ICT)';
  SELECT id INTO pe_id FROM subjects WHERE name = 'Physical Education and Health';
  SELECT id INTO arts_id FROM subjects WHERE name = 'Arts and Crafts / Fine Arts';
  SELECT id INTO islam_id FROM subjects WHERE name = 'Moral and Religious Education (Islam)';
  SELECT id INTO work_id FROM subjects WHERE name = 'Work and Life-Oriented Education';
  SELECT id INTO physics_id FROM subjects WHERE name = 'Physics';
  SELECT id INTO chemistry_id FROM subjects WHERE name = 'Chemistry';
  SELECT id INTO biology_id FROM subjects WHERE name = 'Biology';
  SELECT id INTO higher_math_id FROM subjects WHERE name = 'Higher Mathematics';
  SELECT id INTO accounting_id FROM subjects WHERE name = 'Accounting';
  SELECT id INTO finance_id FROM subjects WHERE name = 'Finance and Banking';
  SELECT id INTO business_id FROM subjects WHERE name = 'Business Entrepreneurship';
  SELECT id INTO civics_id FROM subjects WHERE name = 'Civics and Citizenship';

  -- Get class IDs
  SELECT id INTO six_id FROM classes WHERE name = 'Six';
  SELECT id INTO seven_id FROM classes WHERE name = 'Seven';
  SELECT id INTO eight_id FROM classes WHERE name = 'Eight';
  SELECT id INTO nine_id FROM classes WHERE name = 'Nine';
  SELECT id INTO ten_id FROM classes WHERE name = 'Ten';

  -- Get teacher IDs
  SELECT id INTO t001 FROM teachers WHERE teacher_id = 'T001';
  SELECT id INTO t002 FROM teachers WHERE teacher_id = 'T002';
  SELECT id INTO t003 FROM teachers WHERE teacher_id = 'T003';
  SELECT id INTO t004 FROM teachers WHERE teacher_id = 'T004';
  SELECT id INTO t005 FROM teachers WHERE teacher_id = 'T005';
  SELECT id INTO t006 FROM teachers WHERE teacher_id = 'T006';
  SELECT id INTO t007 FROM teachers WHERE teacher_id = 'T007';
  SELECT id INTO t008 FROM teachers WHERE teacher_id = 'T008';
  SELECT id INTO t009 FROM teachers WHERE teacher_id = 'T009';
  SELECT id INTO t010 FROM teachers WHERE teacher_id = 'T010';
  SELECT id INTO t011 FROM teachers WHERE teacher_id = 'T011';
  SELECT id INTO t012 FROM teachers WHERE teacher_id = 'T012';
  SELECT id INTO t013 FROM teachers WHERE teacher_id = 'T013';
  SELECT id INTO t014 FROM teachers WHERE teacher_id = 'T014';
  SELECT id INTO t015 FROM teachers WHERE teacher_id = 'T015';

  -- T001: Abdur Rahman → Bangla 1st + 2nd (all classes)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t001, bangla1_id, six_id, 5), (t001, bangla2_id, six_id, 4),
    (t001, bangla1_id, seven_id, 5), (t001, bangla2_id, seven_id, 4),
    (t001, bangla1_id, eight_id, 5), (t001, bangla2_id, eight_id, 4),
    (t001, bangla1_id, nine_id, 5), (t001, bangla2_id, nine_id, 4),
    (t001, bangla1_id, ten_id, 5), (t001, bangla2_id, ten_id, 4);

  -- T002: Fatima Begum → Bangla 1st + 2nd (all classes)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t002, bangla1_id, six_id, 5), (t002, bangla2_id, six_id, 4),
    (t002, bangla1_id, seven_id, 5), (t002, bangla2_id, seven_id, 4),
    (t002, bangla1_id, eight_id, 5), (t002, bangla2_id, eight_id, 4),
    (t002, bangla1_id, nine_id, 5), (t002, bangla2_id, nine_id, 4),
    (t002, bangla1_id, ten_id, 5), (t002, bangla2_id, ten_id, 4);

  -- T003: Shahidul Islam → English (all classes)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t003, eng1_id, six_id, 5), (t003, eng_gram_id, six_id, 4),
    (t003, eng1_id, seven_id, 5), (t003, eng_gram_id, seven_id, 4),
    (t003, eng1_id, eight_id, 5), (t003, eng_gram_id, eight_id, 4),
    (t003, eng1_id, nine_id, 4), (t003, eng_gram_id, nine_id, 3),
    (t003, eng1_id, ten_id, 4), (t003, eng_gram_id, ten_id, 3);

  -- T004: Nasrin Akhter → English (all classes)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t004, eng1_id, six_id, 5), (t004, eng_gram_id, six_id, 4),
    (t004, eng1_id, seven_id, 5), (t004, eng_gram_id, seven_id, 4),
    (t004, eng1_id, eight_id, 5), (t004, eng_gram_id, eight_id, 4),
    (t004, eng1_id, nine_id, 4), (t004, eng_gram_id, nine_id, 3),
    (t004, eng1_id, ten_id, 4), (t004, eng_gram_id, ten_id, 3);

  -- T005: Rafiqul Hasan → Math (Six, Seven, Eight)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t005, math_id, six_id, 6), (t005, math_id, seven_id, 6), (t005, math_id, eight_id, 6);

  -- T006: Selina Parvin → Math (Nine, Ten)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t006, math_id, nine_id, 6), (t006, math_id, ten_id, 6);

  -- T007: Kamrul Hasan → Science (6-8) + Physics (9-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t007, science_id, six_id, 5), (t007, science_id, seven_id, 5), (t007, science_id, eight_id, 5),
    (t007, physics_id, nine_id, 4), (t007, physics_id, ten_id, 4);

  -- T008: Rebeka Sultana → Chemistry + Biology (9-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t008, chemistry_id, nine_id, 4), (t008, chemistry_id, ten_id, 4),
    (t008, biology_id, nine_id, 4), (t008, biology_id, ten_id, 4);

  -- T009: Mozammel Haque → BGS (6-10) + Civics (9-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t009, bgs_id, six_id, 4), (t009, bgs_id, seven_id, 4), (t009, bgs_id, eight_id, 4),
    (t009, bgs_id, nine_id, 3), (t009, bgs_id, ten_id, 3),
    (t009, civics_id, nine_id, 3), (t009, civics_id, ten_id, 3);

  -- T010: Shirin Akhter → ICT (6-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t010, ict_id, six_id, 2), (t010, ict_id, seven_id, 2), (t010, ict_id, eight_id, 2),
    (t010, ict_id, nine_id, 2), (t010, ict_id, ten_id, 2);

  -- T011: Abdul Karim → Physical Education (6-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t011, pe_id, six_id, 2), (t011, pe_id, seven_id, 2), (t011, pe_id, eight_id, 2),
    (t011, pe_id, nine_id, 2), (t011, pe_id, ten_id, 2);

  -- T012: Anwara Begum → Arts & Crafts (6-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t012, arts_id, six_id, 2), (t012, arts_id, seven_id, 2), (t012, arts_id, eight_id, 2),
    (t012, arts_id, nine_id, 2), (t012, arts_id, ten_id, 2);

  -- T013: Nurul Islam → Moral & Religious Education (Islam) (6-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t013, islam_id, six_id, 2), (t013, islam_id, seven_id, 2), (t013, islam_id, eight_id, 2),
    (t013, islam_id, nine_id, 2), (t013, islam_id, ten_id, 2);

  -- T014: Sirajul Islam → Work & Life-Oriented Education (6-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t014, work_id, six_id, 2), (t014, work_id, seven_id, 2), (t014, work_id, eight_id, 2),
    (t014, work_id, nine_id, 2), (t014, work_id, ten_id, 2);

  -- T015: Mahmuda Khatun → Higher Math (9-10) + Accounting/Finance/Business (9-10)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t015, higher_math_id, nine_id, 4), (t015, higher_math_id, ten_id, 4),
    (t015, accounting_id, nine_id, 4), (t015, accounting_id, ten_id, 4),
    (t015, finance_id, nine_id, 3), (t015, finance_id, ten_id, 3),
    (t015, business_id, nine_id, 3), (t015, business_id, ten_id, 3);
END $$;

-- =============================================
-- 3b. TEACHER-SUBJECT ASSIGNMENTS (T016-T025)
-- =============================================
DO $$
DECLARE
  -- Subject IDs
  bangla1_id INT; bangla2_id INT;
  eng1_id INT; eng_gram_id INT;
  math_id INT;
  accounting_id INT; finance_id INT; business_id INT;
  geography_id INT; history_id INT; economics_id INT;
  agriculture_id INT; homescience_id INT; arabic_id INT;
  -- Class IDs
  six_id INT; seven_id INT; eight_id INT; nine_id INT; ten_id INT;
  -- Teacher IDs
  t016 INT; t017 INT; t018 INT; t019 INT; t020 INT;
  t021 INT; t022 INT; t023 INT; t024 INT; t025 INT;
BEGIN
  SELECT id INTO bangla1_id FROM subjects WHERE name = 'Bangla 1st Paper';
  SELECT id INTO bangla2_id FROM subjects WHERE name = 'Bangla 2nd Paper (Grammar/Composition)';
  SELECT id INTO eng1_id FROM subjects WHERE name = 'English for Today';
  SELECT id INTO eng_gram_id FROM subjects WHERE name = 'English Grammar';
  SELECT id INTO math_id FROM subjects WHERE name = 'Mathematics';
  SELECT id INTO accounting_id FROM subjects WHERE name = 'Accounting';
  SELECT id INTO finance_id FROM subjects WHERE name = 'Finance and Banking';
  SELECT id INTO business_id FROM subjects WHERE name = 'Business Entrepreneurship';
  SELECT id INTO geography_id FROM subjects WHERE name = 'Geography and Environment';
  SELECT id INTO history_id FROM subjects WHERE name = 'History of Bangladesh and World Civilization';
  SELECT id INTO economics_id FROM subjects WHERE name = 'Economics';
  SELECT id INTO agriculture_id FROM subjects WHERE name = 'Agriculture Studies';
  SELECT id INTO homescience_id FROM subjects WHERE name = 'Home Science';
  SELECT id INTO arabic_id FROM subjects WHERE name = 'Arabic';

  SELECT id INTO six_id FROM classes WHERE name = 'Six';
  SELECT id INTO seven_id FROM classes WHERE name = 'Seven';
  SELECT id INTO eight_id FROM classes WHERE name = 'Eight';
  SELECT id INTO nine_id FROM classes WHERE name = 'Nine';
  SELECT id INTO ten_id FROM classes WHERE name = 'Ten';

  SELECT id INTO t016 FROM teachers WHERE teacher_id = 'T016';
  SELECT id INTO t017 FROM teachers WHERE teacher_id = 'T017';
  SELECT id INTO t018 FROM teachers WHERE teacher_id = 'T018';
  SELECT id INTO t019 FROM teachers WHERE teacher_id = 'T019';
  SELECT id INTO t020 FROM teachers WHERE teacher_id = 'T020';
  SELECT id INTO t021 FROM teachers WHERE teacher_id = 'T021';
  SELECT id INTO t022 FROM teachers WHERE teacher_id = 'T022';
  SELECT id INTO t023 FROM teachers WHERE teacher_id = 'T023';
  SELECT id INTO t024 FROM teachers WHERE teacher_id = 'T024';
  SELECT id INTO t025 FROM teachers WHERE teacher_id = 'T025';

  -- T016: Abdul Gafur → Geography + History (Nine-C, Ten-C Humanities)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t016, geography_id, nine_id, 3), (t016, geography_id, ten_id, 3),
    (t016, history_id, nine_id, 3), (t016, history_id, ten_id, 3);

  -- T017: Shahida Parvin → Economics + Civics (Nine-C, Ten-C Humanities)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t017, economics_id, nine_id, 3), (t017, economics_id, ten_id, 3);

  -- T018: Shamsul Alam → Accounting (Nine-B, Ten-B Commerce)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t018, accounting_id, nine_id, 4), (t018, accounting_id, ten_id, 4);

  -- T019: Tahmina Akhter → Finance + Business (Nine-B, Ten-B Commerce)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t019, finance_id, nine_id, 3), (t019, finance_id, ten_id, 3),
    (t019, business_id, nine_id, 3), (t019, business_id, ten_id, 3);

  -- T020: Abul Kalam Azad → Arabic (Six-Ten)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t020, arabic_id, six_id, 1), (t020, arabic_id, seven_id, 1),
    (t020, arabic_id, eight_id, 1), (t020, arabic_id, nine_id, 1),
    (t020, arabic_id, ten_id, 1);

  -- T021: Rowshan Ara → Agriculture (Nine, Ten)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t021, agriculture_id, nine_id, 2), (t021, agriculture_id, ten_id, 2);

  -- T022: Harun Or Rashid → Mathematics (Six, Seven, Eight) — helps T005
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t022, math_id, six_id, 5), (t022, math_id, seven_id, 5), (t022, math_id, eight_id, 5);

  -- T023: Nasima Begum → Bangla 1st + 2nd (Six, Seven, Eight) — helps T001/T002
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t023, bangla1_id, six_id, 5), (t023, bangla2_id, six_id, 4),
    (t023, bangla1_id, seven_id, 5), (t023, bangla2_id, seven_id, 4),
    (t023, bangla1_id, eight_id, 5), (t023, bangla2_id, eight_id, 4);

  -- T024: Ziaur Rahman → English for Today + Grammar (Six, Seven, Eight) — helps T003/T004
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t024, eng1_id, six_id, 5), (t024, eng_gram_id, six_id, 4),
    (t024, eng1_id, seven_id, 5), (t024, eng_gram_id, seven_id, 4),
    (t024, eng1_id, eight_id, 5), (t024, eng_gram_id, eight_id, 4);

  -- T025: Khurshida Begum → Home Science (Nine, Ten)
  INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, class_load) VALUES
    (t025, homescience_id, nine_id, 2), (t025, homescience_id, ten_id, 2);
END $$;

-- =============================================
-- 4. CLASS TEACHERS
-- =============================================
DO $$
DECLARE
  t001 INT; t002 INT; t003 INT; t004 INT; t005 INT;
  t006 INT; t007 INT; t008 INT; t009 INT; t010 INT;
  t011 INT; t012 INT; t013 INT; t014 INT; t015 INT;
  sec RECORD;
BEGIN
  SELECT id INTO t001 FROM teachers WHERE teacher_id = 'T001';
  SELECT id INTO t002 FROM teachers WHERE teacher_id = 'T002';
  SELECT id INTO t003 FROM teachers WHERE teacher_id = 'T003';
  SELECT id INTO t004 FROM teachers WHERE teacher_id = 'T004';
  SELECT id INTO t005 FROM teachers WHERE teacher_id = 'T005';
  SELECT id INTO t006 FROM teachers WHERE teacher_id = 'T006';
  SELECT id INTO t007 FROM teachers WHERE teacher_id = 'T007';
  SELECT id INTO t008 FROM teachers WHERE teacher_id = 'T008';
  SELECT id INTO t009 FROM teachers WHERE teacher_id = 'T009';
  SELECT id INTO t010 FROM teachers WHERE teacher_id = 'T010';
  SELECT id INTO t011 FROM teachers WHERE teacher_id = 'T011';
  SELECT id INTO t012 FROM teachers WHERE teacher_id = 'T012';
  SELECT id INTO t013 FROM teachers WHERE teacher_id = 'T013';
  SELECT id INTO t014 FROM teachers WHERE teacher_id = 'T014';
  SELECT id INTO t015 FROM teachers WHERE teacher_id = 'T015';

  -- Six A → T001 (Abdur Rahman), Six B → T002 (Fatima), Six C → T005 (Rafiqul)
  FOR sec IN SELECT s.id, s.name AS section_name
             FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.name = 'Six'
  LOOP
    IF sec.section_name = 'A' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t001, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSIF sec.section_name = 'B' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t002, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSE
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t005, sec.id) ON CONFLICT (section_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Seven A → T003 (Shahidul), Seven B → T004 (Nasrin), Seven C → T006 (Selina)
  FOR sec IN SELECT s.id, s.name AS section_name
             FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.name = 'Seven'
  LOOP
    IF sec.section_name = 'A' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t003, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSIF sec.section_name = 'B' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t004, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSE
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t006, sec.id) ON CONFLICT (section_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Eight A → T007 (Kamrul), Eight B → T009 (Mozammel), Eight C → T010 (Shirin)
  FOR sec IN SELECT s.id, s.name AS section_name
             FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.name = 'Eight'
  LOOP
    IF sec.section_name = 'A' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t007, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSIF sec.section_name = 'B' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t009, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSE
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t010, sec.id) ON CONFLICT (section_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Nine A → T008 (Rebeka), Nine B → T015 (Mahmuda), Nine C → T011 (Abdul Karim)
  FOR sec IN SELECT s.id, s.name AS section_name
             FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.name = 'Nine'
  LOOP
    IF sec.section_name = 'A' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t008, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSIF sec.section_name = 'B' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t015, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSE
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t011, sec.id) ON CONFLICT (section_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Ten A → T013 (Nurul Islam), Ten B → T014 (Sirajul), Ten C → T012 (Anwara)
  FOR sec IN SELECT s.id, s.name AS section_name
             FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ten'
  LOOP
    IF sec.section_name = 'A' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t013, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSIF sec.section_name = 'B' THEN
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t014, sec.id) ON CONFLICT (section_id) DO NOTHING;
    ELSE
      INSERT INTO class_teachers (teacher_id, section_id) VALUES (t012, sec.id) ON CONFLICT (section_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
