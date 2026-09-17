-- Self-reported outcome after finishing a chunk. "hard" answers are what the
-- review list is built from, so this is a log (one row per attempt) rather
-- than a single mutable state per chunk.
CREATE TABLE IF NOT EXISTS user_drill_results (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  chunk_id text NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_drill_results_result_check CHECK (result IN ('got_it', 'struggled'))
);

CREATE INDEX IF NOT EXISTS user_drill_results_user_chunk_idx
  ON user_drill_results (user_id, chunk_id, created_at DESC);

ALTER TABLE user_drill_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drill_results FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_drill_results_self ON user_drill_results;
CREATE POLICY user_drill_results_self ON user_drill_results
  FOR ALL
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON user_drill_results TO app';
  END IF;
END
$$;
