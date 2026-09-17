import { Hono } from "hono";
import { getHardChunks, getReviewGroups } from "@vibe-english/domain";
import type { AppContext } from "../context";
import { requireAuth } from "../middleware/auth";

export const flagRoutes = new Hono<AppContext>()
  .use("*", requireAuth)

  .get("/hard", async (c) => {
    const chunks = await getHardChunks(c.get("db"), c.get("user").id);
    return c.json({ chunks });
  });

export const reviewRoutes = new Hono<AppContext>()
  .use("*", requireAuth)

  .get("/", async (c) => {
    const groups = await getReviewGroups(c.get("db"), c.get("user").id);
    return c.json({ groups });
  });
