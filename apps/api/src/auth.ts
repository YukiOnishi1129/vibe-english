import { betterAuth } from "better-auth";
import type { Pool } from "@neondatabase/serverless";
import type { Env } from "./env";

/**
 * Better Auth instance, built per request because it needs the Worker's env
 * bindings and a request-scoped connection pool.
 *
 * MVP ships Google only. Additional providers (email/password, LINE, MFA) plug
 * into this same config later without touching the routes.
 */
export function createAuth(env: Env, pool: Pool) {
  return betterAuth({
    // Better Auth drives its own Kysely instance over this pool; the schema in
    // db/migrations/000001 matches its default camelCase Postgres mapping.
    database: pool,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: "/api/auth",
    trustedOrigins: [env.BETTER_AUTH_URL],
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      // Same-origin in production (/api/* and /* share one Worker), so the
      // session cookie can stay httpOnly + SameSite=Lax with no CORS hop.
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.BETTER_AUTH_URL.startsWith("https://"),
        path: "/",
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
