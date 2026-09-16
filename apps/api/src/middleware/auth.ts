import { createMiddleware } from "hono/factory";
import type { AppContext } from "../context";

/**
 * Rejects unauthenticated requests with 401.
 *
 * The session is read from the httpOnly cookie by Better Auth; nothing
 * user-controlled from the request body or query is trusted here.
 */
export const requireAuth = createMiddleware<AppContext>(async (c, next) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "unauthorized" }, 401);
  }

  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  });

  await next();
});
