CREATE TABLE IF NOT EXISTS user_progress (
  user_id text NOT NULL,
  chunk_id text NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  seen_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamptz,
  last_completed_at timestamptz,
  PRIMARY KEY (user_id, chunk_id)
);

CREATE TABLE IF NOT EXISTS user_flags (
  user_id text NOT NULL,
  chunk_id text NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  flag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chunk_id, flag),
  CONSTRAINT user_flags_flag_check CHECK (flag IN ('hard'))
);

CREATE INDEX IF NOT EXISTS user_flags_user_flag_idx ON user_flags (user_id, flag);
