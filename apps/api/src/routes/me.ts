import { Hono } from "hono";
import type { AppContext } from "../context";
import { requireAuth } from "../middleware/auth";

export const meRoutes = new Hono<AppContext>().get("/", requireAuth, (c) =>
  c.json(c.get("user")),
);
