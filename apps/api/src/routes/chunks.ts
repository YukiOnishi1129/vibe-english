import { Hono } from "hono";
import {
  completeChunk,
  finishChunk,
  getChunk,
  getDailySession,
  getTodayChunks,
  setHardFlag,
} from "@vibe-english/domain";
import type { DrillResult } from "@vibe-english/domain";
import type { AppContext } from "../context";
import { requireAuth } from "../middleware/auth";

export const chunkRoutes = new Hono<AppContext>()
  .use("*", requireAuth)

  .get("/today", async (c) => {
    const chunks = await getTodayChunks(c.get("db"), c.get("user").id);
    return c.json({ chunks });
  })

  // The queue the app actually opens with: a few chunks plus the streak.
  .get("/session", async (c) => {
    const session = await getDailySession(c.get("db"), c.get("user").id);
    return c.json(session);
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

  // Finishing reports how it went, which feeds the review list and the streak.
  .post("/:id/finish", async (c) => {
    const body = await c.req
      .json<{ result?: string }>()
      .catch((): { result?: string } => ({}));
    const result = body.result;

    if (result !== "got_it" && result !== "struggled") {
      return c.json(
        { error: "invalid_result", expected: ["got_it", "struggled"] },
        400,
      );
    }

    const outcome = await finishChunk(
      c.get("db"),
      c.get("user").id,
      c.req.param("id"),
      result satisfies DrillResult,
    );
    if (!outcome) return c.json({ error: "not_found" }, 404);
    return c.json(outcome);
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
