-- Better Auth core schema (user / session / account / verification).
-- Column names follow Better Auth's default Postgres mapping.

CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  "expiresAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON "account" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS account_provider_account_idx
  ON "account" ("providerId", "accountId");

CREATE TABLE IF NOT EXISTS "verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification" (identifier);
