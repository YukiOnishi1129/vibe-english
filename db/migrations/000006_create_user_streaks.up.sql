-- Streak state. Derived from activity, but stored so the daily rollover is
-- decided once (on completion) instead of recomputed from history per request.
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id text PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  -- Date, not timestamp: "did they practice today" is a calendar question.
  last_practiced_on date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_streaks_self ON user_streaks;
CREATE POLICY user_streaks_self ON user_streaks
  FOR ALL
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON user_streaks TO app';
  END IF;
END
$$;
