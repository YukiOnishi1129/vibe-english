import { Hono } from "hono";
import { createDb } from "@vibe-english/db";
import { createAuth } from "./auth";
import { assertEnv, type Env } from "./env";
import type { AppContext } from "./context";
import { meRoutes } from "./routes/me";
import { chunkRoutes } from "./routes/chunks";
import { flagRoutes, reviewRoutes } from "./routes/flags";

const app = new Hono<AppContext>();

/**
 * One database handle and one Better Auth instance per request. Cloudflare
 * forbids reusing I/O objects across requests, so these cannot be globals.
 * The connection is closed after the response is produced.
 */
app.use("/api/*", async (c, next) => {
  assertEnv(c.env);

  const { db, pool, dispose } = createDb(c.env.DATABASE_URL);
  c.set("db", db);
  c.set("auth", createAuth(c.env, pool));

  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(dispose());
  }
});

// Better Auth owns /api/auth/* (Google sign-in, callback, session, sign-out).
app.on(["GET", "POST"], "/api/auth/*", (c) =>
  c.get("auth").handler(c.req.raw),
);

app.route("/api/me", meRoutes);
app.route("/api/chunks", chunkRoutes);
app.route("/api/flags", flagRoutes);
app.route("/api/review", reviewRoutes);

app.notFound((c) =>
  c.req.path.startsWith("/api/")
    ? c.json({ error: "not_found" }, 404)
    : // Non-API paths are served by the static asset handler, not the Worker.
      c.text("Not Found", 404),
);

app.onError((error, c) => {
  console.error("unhandled error", error);
  return c.json({ error: "internal_error" }, 500);
});

export default app satisfies ExportedHandler<Env>;
