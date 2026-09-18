DROP POLICY IF EXISTS user_courses_self ON user_courses;
DROP TABLE IF EXISTS user_courses;
ALTER TABLE chunks DROP COLUMN IF EXISTS unit_id;
DROP TABLE IF EXISTS course_units;
DROP TABLE IF EXISTS courses;
