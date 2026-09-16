/** Bindings and secrets the Worker expects. Values come from wrangler
 *  (`.dev.vars` locally, `wrangler secret` / dashboard in production). */
export type Env = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const satisfies readonly (keyof Env)[];

/** Fails fast with a clear message instead of a confusing runtime error. */
export function assertEnv(env: Partial<Env>): asserts env is Env {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variable(s): ${missing.join(", ")}. See .env.example.`,
    );
  }
}
