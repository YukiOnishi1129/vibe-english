-- RLS is the real authorization layer for per-user data.
-- The app connects as a non-owner role WITHOUT BYPASSRLS; each transaction
-- sets app.user_id via set_config(..., true) (transaction-local).

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

-- Belt and braces: also applies to the table owner, so a misconfigured
-- connection role cannot silently read every user's rows.
ALTER TABLE user_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE user_flags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_progress_self ON user_progress;
CREATE POLICY user_progress_self ON user_progress
  FOR ALL
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS user_flags_self ON user_flags;
CREATE POLICY user_flags_self ON user_flags
  FOR ALL
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Grant the application role access to the tables it needs. The role is
-- created out of band (see README); this is a no-op when it does not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO app';
    EXECUTE 'GRANT SELECT ON chunks, chunk_examples, chunk_drills TO app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON user_progress, user_flags TO app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "user", "session", "account", "verification" TO app';
  END IF;
END
$$;
