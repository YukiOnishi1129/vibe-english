import { Hono } from "hono";
import {
  completeChunk,
  getChunk,
  getTodayChunks,
  setHardFlag,
} from "@vibe-english/domain";
import type { AppContext } from "../context";
import { requireAuth } from "../middleware/auth";

export const chunkRoutes = new Hono<AppContext>()
  .use("*", requireAuth)

  .get("/today", async (c) => {
    const chunks = await getTodayChunks(c.get("db"), c.get("user").id);
    return c.json({ chunks });
  })

  .get("/:id", async (c) => {
    const chunk = await getChunk(c.get("db"), c.get("user").id, c.req.param("id"));
    if (!chunk) return c.json({ error: "not_found" }, 404);
    return c.json(chunk);
  })

  .post("/:id/complete", async (c) => {
    const progress = await completeChunk(
      c.get("db"),
      c.get("user").id,
      c.req.param("id"),
    );
    if (!progress) return c.json({ error: "not_found" }, 404);
    return c.json({ progress });
  })

  .post("/:id/flags/hard", async (c) => {
    const ok = await setHardFlag(
      c.get("db"),
      c.get("user").id,
      c.req.param("id"),
      true,
    );
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ isHard: true });
  })

  .delete("/:id/flags/hard", async (c) => {
    const ok = await setHardFlag(
      c.get("db"),
      c.get("user").id,
      c.req.param("id"),
      false,
    );
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ isHard: false });
  });
