-- Courses group chunks into an ordered curriculum, for learners who want to
-- work through a topic systematically rather than take today's random five.
CREATE TABLE IF NOT EXISTS courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS courses_active_sort_idx ON courses (is_active, sort_order);

CREATE TABLE IF NOT EXISTS course_units (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS course_units_course_idx
  ON course_units (course_id, sort_order);

-- A chunk belongs to at most one unit. Chunks with no unit are the everyday
-- pool that "today's lesson" draws from.
ALTER TABLE chunks
  ADD COLUMN IF NOT EXISTS unit_id text REFERENCES course_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS chunks_unit_idx ON chunks (unit_id, sort_order);

-- Which course the learner is currently working through.
CREATE TABLE IF NOT EXISTS user_courses (
  user_id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_courses_self ON user_courses;
CREATE POLICY user_courses_self ON user_courses
  FOR ALL
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    EXECUTE 'GRANT SELECT ON courses, course_units TO app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON user_courses TO app';
  END IF;
END
$$;
